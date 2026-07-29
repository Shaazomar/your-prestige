import sharp from "sharp";
import type { ExtractedImage } from "./images";

/**
 * A catalogue page contains far more images than products: the brand logo on
 * every page, rule lines, bullet glyphs, colour swatches, certification marks,
 * background washes. Importing all of them would bury six real photographs
 * under sixty pieces of furniture.
 *
 * Everything rejected here is *recorded* with its reason rather than dropped,
 * so the review screen can show "18 images rejected — 12 too small, 6 flat
 * colour" and an admin can disagree.
 */

export type AssetKind = "lifestyle" | "texture" | "swatch" | "logo" | "page-scan" | "unknown";

export interface Classification {
  kind: AssetKind;
  rejected: boolean;
  reason?: string;
  /** Sharp's measurements, reused later so we only compute stats once. */
  entropy: number;
  stdev: number;
}

export const MIN_DIMENSION = 320;
export const MIN_AREA = 200_000;
export const MIN_ASPECT = 0.2;
export const MAX_ASPECT = 5.0;
export const FLAT_STDEV = 4;
export const LOW_ENTROPY = 2.5;
/** One image covering most of the page means the page is a scan. */
export const PAGE_SCAN_COVERAGE = 0.85;

export async function classifyImage(img: ExtractedImage): Promise<Classification> {
  const { width, height } = img;
  const aspect = width / height;

  const base = { entropy: 0, stdev: 0 };

  // — Cheap geometric rejections first, before touching pixels —
  if (img.pageCoverage >= PAGE_SCAN_COVERAGE && width >= MIN_DIMENSION) {
    // Kept, not rejected: for a scanned catalogue this is the only imagery
    // there is. Flagged so the import can warn that manual work is needed.
    return { ...base, kind: "page-scan", rejected: false };
  }
  if (width < MIN_DIMENSION || height < MIN_DIMENSION) {
    return {
      ...base,
      kind: width < 150 && height < 150 ? "logo" : "swatch",
      rejected: true,
      reason: `too small (${width}x${height}, minimum ${MIN_DIMENSION}px)`,
    };
  }
  if (width * height < MIN_AREA) {
    return { ...base, kind: "swatch", rejected: true, reason: `area below ${MIN_AREA}px²` };
  }
  if (aspect < MIN_ASPECT || aspect > MAX_ASPECT) {
    return {
      ...base,
      kind: "logo",
      rejected: true,
      reason: `extreme aspect ratio (${aspect.toFixed(2)}) — rule or banner`,
    };
  }

  // — Pixel statistics —
  let entropy = 0;
  let stdev = 0;
  try {
    const stats = await sharp(img.data, {
      raw: { width, height, channels: img.channels },
    }).stats();
    entropy = stats.entropy;
    stdev = Math.max(...stats.channels.map((c) => c.stdev));
  } catch {
    return { ...base, kind: "unknown", rejected: true, reason: "unreadable pixels" };
  }

  if (stdev < FLAT_STDEV) {
    // Still useful — a flat block is often the collection's colour chip.
    return { entropy, stdev, kind: "swatch", rejected: true, reason: "flat colour fill" };
  }
  if (entropy < LOW_ENTROPY) {
    return { entropy, stdev, kind: "swatch", rejected: true, reason: "low detail (gradient or panel)" };
  }

  // Square-ish and highly detailed reads as a material macro; wider framing
  // reads as a room scene. Refined again in linking, where on-page area and
  // position carry more weight than pixels alone.
  const kind: AssetKind = aspect > 1.2 || aspect < 0.85 ? "lifestyle" : "texture";
  return { entropy, stdev, kind, rejected: false };
}

/**
 * Images that appear on at least `threshold` of pages are page furniture — the
 * masthead, the footer mark, a decorative border. Detected across the whole
 * import once every page has been hashed.
 */
export function findRepeatedAssets(
  assets: { dHash: string; page: number }[],
  pageCount: number,
  threshold = 0.3
): Set<string> {
  if (pageCount < 3) return new Set();
  const pagesByHash = new Map<string, Set<number>>();
  for (const a of assets) {
    if (!pagesByHash.has(a.dHash)) pagesByHash.set(a.dHash, new Set());
    pagesByHash.get(a.dHash)!.add(a.page);
  }
  const min = Math.max(3, Math.ceil(pageCount * threshold));
  return new Set(
    [...pagesByHash.entries()].filter(([, pages]) => pages.size >= min).map(([hash]) => hash)
  );
}
