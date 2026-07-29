import sharp from "sharp";

/**
 * Encodes an extracted bitmap for delivery.
 *
 * Deliberately produces **one** WebP master rather than a thumbnail/medium/large
 * ladder in WebP and AVIF. `next.config.ts` already sets
 * `formats: ["image/avif", "image/webp"]`, so `next/image` derives AVIF, WebP
 * and the full responsive srcset from a single source on demand — and
 * Cloudinary does the same with `f_auto,q_auto,w_*`. Pre-generating eight files
 * per image would multiply storage and, more painfully, add AVIF encode time
 * measured in seconds per image across hundreds of images, to deliver bytes
 * the CDN was going to produce anyway.
 *
 * Set `IMAGE_DERIVATIVES=full` to force the explicit ladder — the escape hatch
 * for hosting without an image transform layer.
 */

export interface EncodedImage {
  /** The master, ready to upload. */
  master: Buffer;
  width: number;
  height: number;
  /** ~300-byte data URI for next/image's `placeholder="blur"`. */
  blurDataUrl: string;
  /** Only populated when IMAGE_DERIVATIVES=full. */
  variants: { label: string; buffer: Buffer; width: number; format: "webp" | "avif" }[];
}

const MAX_EDGE = 2400;
const QUALITY = 82;
const LADDER = [
  { label: "thumbnail", width: 400 },
  { label: "medium", width: 1200 },
  { label: "large", width: 2400 },
];

export function fullDerivativesEnabled(): boolean {
  return process.env.IMAGE_DERIVATIVES === "full";
}

export async function encodeImage(
  data: Buffer,
  width: number,
  height: number,
  channels: 1 | 3 | 4
): Promise<EncodedImage> {
  const source = () => sharp(data, { raw: { width, height, channels } });

  const master = await source()
    .resize({
      width: Math.min(width, MAX_EDGE),
      height: Math.min(height, MAX_EDGE),
      fit: "inside",
      withoutEnlargement: true,
    })
    // smartSubsample preserves fine veining and grout lines; plain 4:2:0
    // chroma subsampling visibly softens exactly the detail a tile catalogue
    // is selling.
    .webp({ quality: QUALITY, smartSubsample: true })
    .toBuffer();

  const meta = await sharp(master).metadata();

  const blur = await source().resize(16, 16, { fit: "inside" }).webp({ quality: 20 }).toBuffer();
  const blurDataUrl = `data:image/webp;base64,${blur.toString("base64")}`;

  const variants: EncodedImage["variants"] = [];
  if (fullDerivativesEnabled()) {
    for (const step of LADDER) {
      if (step.width > width * 1.2) continue;
      for (const format of ["webp", "avif"] as const) {
        const pipeline = source().resize({ width: step.width, fit: "inside", withoutEnlargement: true });
        variants.push({
          label: step.label,
          width: step.width,
          format,
          buffer: await (format === "webp"
            ? pipeline.webp({ quality: QUALITY, smartSubsample: true })
            : pipeline.avif({ quality: QUALITY - 10 })
          ).toBuffer(),
        });
      }
    }
  }

  return {
    master,
    width: meta.width ?? width,
    height: meta.height ?? height,
    blurDataUrl,
    variants,
  };
}

/**
 * SEO filename from real product facts — "somany-dune-taupe-800x1600-matt"
 * rather than "img_p3_2". This is the image-SEO auto-renaming requirement, and
 * it applies at extraction time so a file is never stored under a junk name.
 */
export function seoFilename(parts: {
  brand?: string | null;
  collection?: string | null;
  name: string;
  size?: string | null;
  finish?: string | null;
  role?: string;
}): string {
  const slug = (s: string) =>
    s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

  const words = [
    parts.brand,
    parts.collection,
    parts.name,
    parts.size?.replace(/\s*[x×]\s*/i, "x"),
    parts.finish,
    parts.role,
  ]
    .filter((p): p is string => !!p && p.trim().length > 0)
    .map(slug)
    .filter(Boolean)
    .flatMap((part) => part.split("-"));

  // De-duplicate at the word level, not the segment level: a "Dune Collection"
  // holding a product called "Dune Taupe" would otherwise yield
  // "somany-dune-collection-dune-taupe".
  const seen = new Set<string>();
  return words
    .filter((w) => w && !seen.has(w) && seen.add(w))
    .join("-")
    .slice(0, 100);
}
