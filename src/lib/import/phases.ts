import { prisma } from "@/lib/prisma";
import { openPdf } from "@/lib/pdf/document";
import { extractPageText } from "@/lib/pdf/text";
import { extractPageImages } from "@/lib/pdf/images";
import { classifyImage, findRepeatedAssets } from "@/lib/pdf/filters";
import { contentHash, dHash, isPerceptualDuplicate } from "@/lib/pdf/hash";
import { encodeImage, seoFilename } from "@/lib/images/derivatives";
import { uploadFile } from "@/lib/storage";
import { readImportFile } from "./source";
import {
  IMAGING_BYTE_BUDGET,
  SLICE_BUDGET_MS,
  type CachedPage,
  type ImportStats,
  EMPTY_STATS,
} from "./types";
import type { CatalogImport, Prisma } from "@prisma/client";

/**
 * The phases of a catalogue import. Each returns how far it got so the caller
 * can persist a cursor; none of them assume they'll run to completion, because
 * every one is interrupted by the slice budget on a large catalogue.
 */

export interface PhaseResult {
  cursor: number;
  processed: number;
  total: number;
  /** True when this phase has nothing left to do. */
  complete: boolean;
  message: string;
  statsDelta?: Partial<ImportStats>;
  /** Set by ANALYZING once the page count is known. */
  pageCount?: number;
  isScanned?: boolean;
}

const outOfTime = (startedAt: number) => Date.now() - startedAt > SLICE_BUDGET_MS;

/**
 * ANALYZING — open the PDF once, cache every page's text blocks and geometry.
 *
 * Everything downstream except IMAGING reads from this cache, so the PDF is
 * parsed for text exactly once no matter how many slices the import takes.
 */
export async function runAnalyzing(
  job: CatalogImport,
  startedAt: number
): Promise<PhaseResult> {
  const data = await readImportFile(job.fileUrl);
  const doc = await openPdf(data);

  try {
    const total = doc.numPages;
    const cached: CachedPage[] = Array.isArray(job.pageText)
      ? (job.pageText as unknown as CachedPage[])
      : [];
    const byPage = new Map(cached.map((p) => [p.page, p]));

    let page = Math.max(1, job.cursor + 1);
    for (; page <= total; page++) {
      if (byPage.has(page)) continue;

      const text = await extractPageText(doc, page);
      byPage.set(page, {
        page,
        width: text.width,
        height: text.height,
        // Raw items are dropped here: the blocks carry everything extraction
        // needs, and keeping every glyph position would bloat the row into
        // megabytes on a long catalogue.
        blocks: text.blocks.map((b) => ({ text: b.text, x: b.x, y: b.y, w: b.w, h: b.h })),
      });

      if (outOfTime(startedAt)) break;
    }

    const pages = [...byPage.values()].sort((a, b) => a.page - b.page);
    const done = pages.length >= total;

    await prisma.catalogImport.update({
      where: { id: job.id },
      data: {
        pageText: pages as unknown as Prisma.InputJsonValue,
        pageCount: total,
      },
    });

    return {
      cursor: Math.min(page, total),
      processed: pages.length,
      total,
      complete: done,
      pageCount: total,
      message: done
        ? `Read ${total} page${total === 1 ? "" : "s"} of text.`
        : `Reading text — ${pages.length} of ${total} pages.`,
    };
  } finally {
    await doc.close();
  }
}

/**
 * IMAGING — pull embedded images, filter out page furniture, encode and store.
 *
 * Sliced by decoded bytes rather than pages: a single spread of full-bleed
 * photography can be more pixels than twenty spec pages combined.
 */
export async function runImaging(
  job: CatalogImport,
  startedAt: number
): Promise<PhaseResult> {
  const total = job.pageCount;
  const data = await readImportFile(job.fileUrl);
  const doc = await openPdf(data);

  const brandFolder = job.brandNameGuess ?? "catalog";
  const stats: Partial<ImportStats> = { imagesKept: 0, imagesRejected: 0, duplicates: 0, failures: 0, scannedPages: 0 };

  // Perceptual hashes already stored for this import, so a resumed run still
  // recognises a duplicate of something processed in an earlier slice.
  const existing = await prisma.importAsset.findMany({
    where: { importId: job.id },
    select: { dHash: true, contentHash: true },
  });
  const knownDHashes = existing.map((e) => e.dHash);
  const knownContent = new Set(existing.map((e) => e.contentHash));

  let bytes = 0;
  let page = Math.max(1, job.cursor + 1);

  try {
    for (; page <= total; page++) {
      const result = await extractPageImages(doc, page, {
        maxBytes: IMAGING_BYTE_BUDGET - bytes,
      });
      bytes += result.bytesDecoded;
      stats.failures = (stats.failures ?? 0) + result.failures.length;

      for (const img of result.images) {
        const classification = await classifyImage(img);
        if (classification.kind === "page-scan") {
          stats.scannedPages = (stats.scannedPages ?? 0) + 1;
        }

        const ch = contentHash(img.data);
        if (knownContent.has(ch)) {
          stats.duplicates = (stats.duplicates ?? 0) + 1;
          continue;
        }
        const dh = await dHash(img.data, img.width, img.height, img.channels);

        const perceptualDupe =
          !classification.rejected && knownDHashes.some((k) => isPerceptualDuplicate(k, dh));
        if (perceptualDupe) {
          stats.duplicates = (stats.duplicates ?? 0) + 1;
          continue;
        }

        knownContent.add(ch);
        knownDHashes.push(dh);

        const rejected = classification.rejected;
        let url: string | null = null;
        let blurDataUrl: string | null = null;
        let filename: string | null = null;

        // Rejected images are recorded but never uploaded — the row exists so
        // the review screen can explain what was discarded and why.
        if (!rejected) {
          const encoded = await encodeImage(img.data, img.width, img.height, img.channels);
          filename = seoFilename({
            brand: job.brandNameGuess,
            name: `page-${page}-${img.objectRef.replace(/[^a-z0-9]/gi, "")}`,
            role: classification.kind,
          });
          const upload = await uploadFile(
            new File([new Uint8Array(encoded.master)], `${filename}.webp`, { type: "image/webp" }),
            { folder: `catalog/${brandFolder}`, filename }
          );
          url = upload.url;
          blurDataUrl = encoded.blurDataUrl;
          stats.imagesKept = (stats.imagesKept ?? 0) + 1;
        } else {
          stats.imagesRejected = (stats.imagesRejected ?? 0) + 1;
        }

        await prisma.importAsset.upsert({
          where: { importId_contentHash: { importId: job.id, contentHash: ch } },
          update: {},
          create: {
            importId: job.id,
            page,
            objectRef: img.objectRef,
            width: img.width,
            height: img.height,
            bytes: img.data.length,
            pageX: img.pageX,
            pageY: img.pageY,
            pageW: img.pageW,
            pageH: img.pageH,
            contentHash: ch,
            dHash: dh,
            kind: classification.kind,
            rejected,
            rejectReason: classification.reason ?? null,
            url,
            blurDataUrl,
            seoFilename: filename,
          },
        });
      }

      if (bytes >= IMAGING_BYTE_BUDGET || outOfTime(startedAt)) {
        page++;
        break;
      }
    }
  } finally {
    await doc.close();
  }

  const cursor = Math.min(page - 1, total);
  const complete = cursor >= total;

  return {
    cursor,
    processed: cursor,
    total,
    complete,
    statsDelta: stats,
    message: complete
      ? `Extracted images from ${total} page${total === 1 ? "" : "s"}.`
      : `Extracting images — page ${cursor} of ${total}.`,
  };
}

/**
 * Post-pass over every stored asset: anything whose perceptual hash recurs
 * across a third of the catalogue is furniture (masthead, footer mark), no
 * matter how respectable its dimensions. Only detectable once all pages are in.
 */
export async function markRepeatedAssets(importId: string, pageCount: number): Promise<number> {
  const assets = await prisma.importAsset.findMany({
    where: { importId, rejected: false },
    select: { id: true, dHash: true, page: true },
  });
  const furniture = findRepeatedAssets(assets, pageCount);
  if (furniture.size === 0) return 0;

  const ids = assets.filter((a) => furniture.has(a.dHash)).map((a) => a.id);
  if (ids.length === 0) return 0;

  await prisma.importAsset.updateMany({
    where: { id: { in: ids } },
    data: { rejected: true, rejectReason: "repeated on most pages — page furniture", kind: "logo" },
  });
  return ids.length;
}

export function readStats(job: CatalogImport): ImportStats {
  if (job.stats && typeof job.stats === "object" && !Array.isArray(job.stats)) {
    return { ...EMPTY_STATS, ...(job.stats as unknown as ImportStats) };
  }
  return { ...EMPTY_STATS };
}

export function mergeStats(base: ImportStats, delta?: Partial<ImportStats>): ImportStats {
  if (!delta) return base;
  const out = { ...base };
  for (const [k, v] of Object.entries(delta) as [keyof ImportStats, number][]) {
    out[k] = (out[k] ?? 0) + (v ?? 0);
  }
  return out;
}

export function readCachedPages(job: CatalogImport): CachedPage[] {
  return Array.isArray(job.pageText) ? (job.pageText as unknown as CachedPage[]) : [];
}
