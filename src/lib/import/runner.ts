import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { findRepeatedLines } from "@/lib/pdf/text";
import { parseBlock, fingerprint } from "@/lib/extract/parse";
import { detectBrand, detectCollections } from "@/lib/extract/detect";
import { enrich } from "@/lib/extract/enrich";
import { linkAssets } from "@/lib/extract/link";
import {
  runAnalyzing, runImaging, markRepeatedAssets,
  readStats, mergeStats, readCachedPages,
  type PhaseResult,
} from "./phases";
import { LOCK_TTL_MS, MAX_ATTEMPTS, SLICE_BUDGET_MS, type ImportProgress } from "./types";
import type { CatalogImport, Prisma } from "@prisma/client";

/**
 * Advances a catalogue import by one slice of work.
 *
 * There is no queue in this project and no background worker, so the browser
 * drives the machine: the import screen calls this repeatedly until `done`.
 * Every slice takes a lock, works to a time budget, then commits its cursor —
 * which means closing the tab pauses an import rather than losing it, and any
 * slice can be safely retried.
 */
export async function advanceImport(importId: string): Promise<ImportProgress> {
  const startedAt = Date.now();
  const token = randomUUID();

  // — Take the lock —
  // A lock older than LOCK_TTL_MS is treated as abandoned: the tab was closed
  // or the process restarted mid-slice, and the work is idempotent anyway.
  const staleBefore = new Date(Date.now() - LOCK_TTL_MS);
  const claimed = await prisma.catalogImport.updateMany({
    where: {
      id: importId,
      deletedAt: null,
      OR: [{ lockedAt: null }, { lockedAt: { lt: staleBefore } }],
    },
    data: { lockedAt: new Date(), lockToken: token },
  });

  if (claimed.count === 0) {
    const current = await prisma.catalogImport.findUnique({ where: { id: importId } });
    return progressOf(current, "Another session is processing this import…", { busy: true });
  }

  let job = await prisma.catalogImport.findUniqueOrThrow({ where: { id: importId } });

  try {
    const result = await runPhase(job, startedAt);

    const nextStatus = result.complete ? nextPhase(job.status) : job.status;
    const stats = mergeStats(readStats(job), result.statsDelta);

    job = await prisma.catalogImport.update({
      where: { id: importId },
      data: {
        status: nextStatus,
        cursor: result.complete ? 0 : result.cursor,
        processed: result.processed,
        total: result.total,
        pageCount: result.pageCount ?? job.pageCount,
        isScanned: result.isScanned ?? job.isScanned,
        phaseMessage: result.message,
        stats: stats as unknown as Prisma.InputJsonValue,
        attempts: 0,
        error: null,
        lockedAt: null,
        lockToken: null,
      },
    });

    return progressOf(job, result.message);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const attempts = job.attempts + 1;
    const failed = attempts >= MAX_ATTEMPTS;

    job = await prisma.catalogImport.update({
      where: { id: importId },
      data: {
        attempts,
        error: message,
        // Keep the cursor: a retry resumes exactly where it stopped rather
        // than reprocessing the whole catalogue.
        status: failed ? "FAILED" : job.status,
        phaseMessage: failed
          ? `Failed after ${attempts} attempts at page ${job.cursor + 1}.`
          : `Error at page ${job.cursor + 1} — will retry (${attempts}/${MAX_ATTEMPTS}).`,
        lockedAt: null,
        lockToken: null,
      },
    });

    return progressOf(job, job.phaseMessage ?? message);
  }
}

async function runPhase(job: CatalogImport, startedAt: number): Promise<PhaseResult> {
  switch (job.status) {
    case "UPLOADED":
      return { cursor: 0, processed: 0, total: 0, complete: true, message: "Starting…" };
    case "ANALYZING":
      return runAnalyzing(job, startedAt);
    case "EXTRACTING":
      return runExtracting(job);
    case "IMAGING":
      return runImaging(job, startedAt);
    case "LINKING":
      return runLinking(job);
    case "ENRICHING":
      return runEnriching(job, startedAt);
    default:
      return {
        cursor: job.cursor,
        processed: job.processed,
        total: job.total,
        complete: false,
        message: job.phaseMessage ?? "",
      };
  }
}

function nextPhase(status: CatalogImport["status"]): CatalogImport["status"] {
  const order: CatalogImport["status"][] = [
    "UPLOADED", "ANALYZING", "EXTRACTING", "IMAGING", "LINKING", "ENRICHING", "READY",
  ];
  const i = order.indexOf(status);
  return i >= 0 && i < order.length - 1 ? order[i + 1] : status;
}

/**
 * EXTRACTING — parse the cached text blocks into candidate products.
 *
 * Runs over the whole document in one slice: it's pure string work against
 * data already in memory, so even a 400-page catalogue is fast. Products are
 * upserted on `fingerprint`, which collapses the same item appearing in a
 * spread and makes the phase idempotent.
 */
async function runExtracting(job: CatalogImport): Promise<PhaseResult> {
  const pages = readCachedPages(job);
  if (pages.length === 0) {
    return { cursor: 0, processed: 0, total: 0, complete: true, message: "No text found in this PDF." };
  }

  // findRepeatedLines wants PageText-ish input; the cached blocks carry enough.
  const asPageText = pages.map((p) => ({
    page: p.page,
    width: p.width,
    height: p.height,
    text: p.blocks.map((b) => b.text).join("\n"),
    items: p.blocks.map((b) => ({ str: b.text.split("\n")[0], x: b.x, y: b.y, w: b.w, h: b.h })),
    blocks: [],
  }));
  const boilerplate = findRepeatedLines(asPageText as never);
  const brand = job.brandNameGuess ?? detectBrand(pages, boilerplate);
  const collections = detectCollections(pages, boilerplate);

  let found = 0;
  const seen = new Set<string>();

  for (const page of pages) {
    for (const block of page.blocks) {
      const parsed = parseBlock(block.text, {
        collection: collections.get(page.page) ?? null,
        boilerplate,
      });
      // A block without a size is a heading, a paragraph, or an address — not
      // a product. This single test removes most false positives.
      if (!parsed || parsed.sizes.length === 0) continue;

      const fp = fingerprint({ brandName: brand, productCode: parsed.productCode, name: parsed.name });
      if (seen.has(fp)) continue;
      seen.add(fp);

      await prisma.extractedProduct.upsert({
        where: { importId_fingerprint: { importId: job.id, fingerprint: fp } },
        // Re-running must not clobber edits a human already made.
        update: {},
        create: {
          importId: job.id,
          fingerprint: fp,
          pageStart: page.page,
          confidence: parsed.confidence,
          fieldScores: parsed.fieldScores as unknown as Prisma.InputJsonValue,
          rawText: parsed.rawText.slice(0, 4000),
          brandName: brand,
          collectionName: parsed.collectionName,
          name: parsed.name,
          productCode: parsed.productCode,
          sizes: parsed.sizes,
          finish: parsed.finish,
          thickness: parsed.thickness,
          material: parsed.material,
          applications: parsed.applications,
          applicationTags: parsed.applicationTags,
          color: parsed.color,
          surface: parsed.surface,
          description: parsed.description,
        },
      });
      found++;
    }
  }

  if (brand && !job.brandNameGuess) {
    await prisma.catalogImport.update({ where: { id: job.id }, data: { brandNameGuess: brand } });
  }

  return {
    cursor: 0,
    processed: found,
    total: found,
    complete: true,
    statsDelta: { productsFound: found },
    message: found
      ? `Found ${found} product${found === 1 ? "" : "s"}${brand ? ` from ${brand}` : ""}.`
      : "No products recognised — this catalogue may be image-only.",
  };
}

/** LINKING — attach images to products, choose hero and texture shots. */
async function runLinking(job: CatalogImport): Promise<PhaseResult> {
  const furniture = await markRepeatedAssets(job.id, job.pageCount);

  const [assets, products] = await Promise.all([
    prisma.importAsset.findMany({
      where: { importId: job.id, rejected: false },
      select: { id: true, page: true, pageX: true, pageY: true, pageW: true, pageH: true, width: true, height: true, kind: true },
    }),
    prisma.extractedProduct.findMany({
      where: { importId: job.id, deletedAt: null },
      select: { id: true, pageStart: true, rawText: true },
    }),
  ]);

  // Recover each product's caption box from the cached blocks.
  //
  // Matching on the stored `rawText` — which *is* the block's text — rather
  // than by index is what makes multi-product pages work. Positional guessing
  // gives every product on a spread the same coordinates, so the nearest-box
  // test collapses and one product takes all the images.
  const pages = readCachedPages(job);
  const blockByPage = new Map(pages.map((p) => [p.page, p.blocks]));

  const linkable = products.map((p) => {
    const blocks = blockByPage.get(p.pageStart) ?? [];
    const block =
      blocks.find((b) => p.rawText && b.text.slice(0, 4000) === p.rawText) ??
      blocks.find((b) => p.rawText && b.text.startsWith(p.rawText.slice(0, 60)));
    return { id: p.id, pageStart: p.pageStart, x: block?.x, y: block?.y, w: block?.w, h: block?.h };
  });

  const assignments = linkAssets(assets, linkable);

  let linked = 0;
  for (const a of assignments) {
    if (!a.productId) continue;
    linked++;
    await prisma.importAsset.update({
      where: { id: a.assetId },
      data: { extractedProductId: a.productId },
    });
    if (a.role === "hero") {
      await prisma.extractedProduct.update({ where: { id: a.productId }, data: { heroAssetId: a.assetId } });
    } else if (a.role === "texture") {
      await prisma.extractedProduct.update({ where: { id: a.productId }, data: { textureAssetId: a.assetId } });
    }
  }

  return {
    cursor: 0,
    processed: linked,
    total: assets.length,
    complete: true,
    message: `Linked ${linked} image${linked === 1 ? "" : "s"} to products${furniture ? `, discarded ${furniture} repeated graphic${furniture === 1 ? "" : "s"}` : ""}.`,
  };
}

/** ENRICHING — compose description, SEO and image metadata for each product. */
async function runEnriching(job: CatalogImport, startedAt: number): Promise<PhaseResult> {
  const pending = await prisma.extractedProduct.findMany({
    where: { importId: job.id, deletedAt: null, enrichedAt: null },
    include: { hero: true, texture: true },
    orderBy: { createdAt: "asc" },
  });
  const total = await prisma.extractedProduct.count({ where: { importId: job.id, deletedAt: null } });

  for (const p of pending) {
    const e = enrich({
      name: p.name,
      brandName: p.brandName,
      collectionName: p.collectionName,
      productCode: p.productCode,
      sizes: Array.isArray(p.sizes) ? (p.sizes as string[]) : [],
      finish: p.finish,
      thickness: p.thickness,
      material: p.material,
      color: p.color,
      surface: p.surface,
      applications: p.applications,
      applicationTags: Array.isArray(p.applicationTags) ? (p.applicationTags as string[]) : [],
      description: p.description,
    });

    await prisma.extractedProduct.update({
      where: { id: p.id },
      data: {
        slug: e.slug,
        premiumDescription: e.premiumDescription,
        seoTitle: e.seoTitle,
        seoDescription: e.seoDescription,
        metaKeywords: e.metaKeywords,
        searchKeywords: e.searchKeywords,
        faqs: e.faqs as unknown as Prisma.InputJsonValue,
        enrichedAt: new Date(),
        enrichedBy: "composed",
      },
    });

    // Image metadata is part of enrichment — alt text is composed from the
    // same facts, so it's never "image1.jpg" or an empty attribute.
    for (const asset of [p.hero, p.texture]) {
      if (!asset) continue;
      await prisma.importAsset.update({
        where: { id: asset.id },
        data: { altText: e.altText, caption: e.caption, title: e.imageTitle },
      });
    }

    if (Date.now() - startedAt > SLICE_BUDGET_MS) break;
  }

  const remaining = await prisma.extractedProduct.count({
    where: { importId: job.id, deletedAt: null, enrichedAt: null },
  });

  return {
    cursor: 0,
    processed: total - remaining,
    total,
    complete: remaining === 0,
    message: remaining === 0
      ? `Ready for review — ${total} product${total === 1 ? "" : "s"}.`
      : `Composing details — ${total - remaining} of ${total}.`,
  };
}

function progressOf(
  job: CatalogImport | null,
  message: string,
  extra?: { busy?: boolean }
): ImportProgress {
  if (!job) {
    return { status: "FAILED", phase: "Import not found", processed: 0, total: 0, done: true, error: "Not found" };
  }
  const terminal: CatalogImport["status"][] = ["READY", "COMPLETED", "FAILED", "CANCELLED"];
  return {
    status: job.status,
    phase: message || job.phaseMessage || "",
    processed: job.processed,
    total: job.total,
    done: terminal.includes(job.status),
    busy: extra?.busy,
    error: job.error,
  };
}
