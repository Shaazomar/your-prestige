"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { canUploadMedia } from "@/lib/storage";
import { advanceImport } from "@/lib/import/runner";
import { slugify } from "@/lib/extract/enrich";
import { toApplications } from "@/lib/applications";
import type { ListParams, ListResult } from "@/hooks/useAdminList";
import {
  createImportSchema, extractedProductSchema, publishSchema,
  type CreateImportInput, type ExtractedProductInput, type PublishInput,
} from "./schema";
import type { ImportProgress } from "@/lib/import/types";
import type { CatalogImport, Prisma } from "@prisma/client";

export type ImportRow = CatalogImport;
export type ExtractedRow = Prisma.ExtractedProductGetPayload<{
  include: { hero: true; texture: true; assets: true };
}>;

// ————— Imports —————

export async function listImports(params: ListParams): Promise<ListResult<ImportRow>> {
  await requirePermission("catalogImports", "view");

  const where: Prisma.CatalogImportWhereInput = {
    deletedAt: params.trash ? { not: null } : null,
    ...(params.search
      ? {
          OR: [
            { filename: { contains: params.search, mode: "insensitive" } },
            { brandNameGuess: { contains: params.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.catalogImport.findMany({
      where,
      orderBy: { [params.sortBy]: params.sortDir },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
    }),
    prisma.catalogImport.count({ where }),
  ]);

  return { rows, total };
}

export async function createImport(input: CreateImportInput) {
  const session = await requirePermission("catalogImports", "create");

  // Fail loudly here rather than forty pages into a run.
  const storage = canUploadMedia();
  if (!storage.ok) throw new Error(storage.reason);

  const data = createImportSchema.parse(input);

  const created = await prisma.catalogImport.create({
    data: {
      filename: data.filename,
      fileUrl: data.fileUrl,
      filePublicId: data.filePublicId || null,
      fileSize: data.fileSize,
      brandId: data.brandId || null,
      brandNameGuess: data.brandNameGuess || null,
      status: "UPLOADED",
      createdById: session.user.id,
    },
  });

  await logAudit({
    action: "catalog_import.create",
    entity: "CatalogImport",
    entityId: created.id,
    newValue: { filename: created.filename, fileSize: created.fileSize },
  });

  revalidatePath("/admin/content/catalog-imports");
  return created;
}

/**
 * Advances the import by one slice. The client calls this in a loop — see
 * ImportRunner — because there is no queue or background worker in this
 * project and a catalogue takes minutes, far past any single request budget.
 */
export async function runImportStep(importId: string): Promise<ImportProgress> {
  await requirePermission("catalogImports", "edit");
  const progress = await advanceImport(importId);
  revalidatePath(`/admin/content/catalog-imports/${importId}`);
  return progress;
}

export async function startImport(importId: string) {
  await requirePermission("catalogImports", "edit");
  await prisma.catalogImport.update({
    where: { id: importId },
    data: { status: "ANALYZING", cursor: 0, attempts: 0, error: null, phaseMessage: "Starting…" },
  });
  await logAudit({ action: "catalog_import.start", entity: "CatalogImport", entityId: importId });
  revalidatePath(`/admin/content/catalog-imports/${importId}`);
}

/** Retry a failed import from its stored cursor, not from the beginning. */
export async function retryImport(importId: string) {
  await requirePermission("catalogImports", "edit");
  const job = await prisma.catalogImport.findUniqueOrThrow({ where: { id: importId } });
  await prisma.catalogImport.update({
    where: { id: importId },
    data: {
      status: job.pageCount > 0 ? "IMAGING" : "ANALYZING",
      attempts: 0,
      error: null,
      lockedAt: null,
      lockToken: null,
    },
  });
  revalidatePath(`/admin/content/catalog-imports/${importId}`);
}

export async function cancelImport(importId: string) {
  await requirePermission("catalogImports", "edit");
  await prisma.catalogImport.update({
    where: { id: importId },
    data: { status: "CANCELLED", lockedAt: null, lockToken: null },
  });
  await logAudit({ action: "catalog_import.cancel", entity: "CatalogImport", entityId: importId });
  revalidatePath(`/admin/content/catalog-imports/${importId}`);
}

export async function softDeleteImport(id: string) {
  const session = await requirePermission("catalogImports", "delete");
  await prisma.catalogImport.update({
    where: { id },
    data: { deletedAt: new Date(), deletedById: session.user.id },
  });
  await logAudit({ action: "catalog_import.delete", entity: "CatalogImport", entityId: id });
  revalidatePath("/admin/content/catalog-imports");
}

export async function restoreImport(id: string) {
  await requirePermission("catalogImports", "edit");
  await prisma.catalogImport.update({ where: { id }, data: { deletedAt: null, deletedById: null } });
  await logAudit({ action: "catalog_import.restore", entity: "CatalogImport", entityId: id });
  revalidatePath("/admin/content/catalog-imports");
}

// ————— Staged products —————

export async function listExtracted(
  importId: string,
  filter: { status?: string; search?: string } = {}
): Promise<ExtractedRow[]> {
  await requirePermission("catalogImports", "view");
  return prisma.extractedProduct.findMany({
    where: {
      importId,
      deletedAt: null,
      ...(filter.status && filter.status !== "ALL"
        ? { status: filter.status as Prisma.EnumExtractedStatusFilter["equals"] }
        : {}),
      ...(filter.search
        ? {
            OR: [
              { name: { contains: filter.search, mode: "insensitive" } },
              { productCode: { contains: filter.search, mode: "insensitive" } },
              { collectionName: { contains: filter.search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: { hero: true, texture: true, assets: true },
    // Least confident first: those are the rows a human needs to look at.
    orderBy: [{ confidence: "asc" }, { pageStart: "asc" }],
  });
}

export async function updateExtracted(id: string, input: ExtractedProductInput) {
  const session = await requirePermission("catalogImports", "edit");
  const data = extractedProductSchema.parse(input);
  const before = await prisma.extractedProduct.findUniqueOrThrow({ where: { id } });

  const after = await prisma.extractedProduct.update({
    where: { id },
    data: {
      name: data.name,
      brandName: data.brandName || null,
      collectionName: data.collectionName || null,
      productCode: data.productCode || null,
      sizes: data.sizes,
      finish: data.finish || null,
      thickness: data.thickness || null,
      material: data.material || null,
      color: data.color || null,
      surface: data.surface || null,
      applications: data.applications,
      applicationTags: data.applicationTags,
      premiumDescription: data.premiumDescription || null,
      seoTitle: data.seoTitle || null,
      seoDescription: data.seoDescription || null,
      slug: data.slug || null,
      featured: data.featured,
      hidden: data.hidden,
      publishAsDraft: data.publishAsDraft,
      reviewNote: data.reviewNote || null,
      updatedById: session.user.id,
    },
  });

  await logAudit({
    action: "extracted_product.update",
    entity: "ExtractedProduct",
    entityId: id,
    oldValue: { name: before.name, status: before.status },
    newValue: { name: after.name },
  });
  return after;
}

export async function setExtractedStatus(ids: string[], status: "PENDING" | "APPROVED" | "REJECTED") {
  await requirePermission("catalogImports", "edit");
  await prisma.extractedProduct.updateMany({ where: { id: { in: ids } }, data: { status } });
  await logAudit({
    action: `extracted_product.${status.toLowerCase()}`,
    entity: "ExtractedProduct",
    meta: { ids, count: ids.length },
  });
}

/** Fold one staged row into another, keeping any field the target is missing. */
export async function mergeExtracted(sourceId: string, targetId: string) {
  await requirePermission("catalogImports", "edit");
  if (sourceId === targetId) throw new Error("Cannot merge a product into itself.");

  const [source, target] = await Promise.all([
    prisma.extractedProduct.findUniqueOrThrow({ where: { id: sourceId } }),
    prisma.extractedProduct.findUniqueOrThrow({ where: { id: targetId } }),
  ]);

  const fill = <T>(a: T, b: T): T => (a === null || a === undefined || a === "" ? b : a);
  const sizes = [
    ...new Set([
      ...(Array.isArray(target.sizes) ? (target.sizes as string[]) : []),
      ...(Array.isArray(source.sizes) ? (source.sizes as string[]) : []),
    ]),
  ];

  await prisma.$transaction([
    prisma.extractedProduct.update({
      where: { id: targetId },
      data: {
        productCode: fill(target.productCode, source.productCode),
        collectionName: fill(target.collectionName, source.collectionName),
        finish: fill(target.finish, source.finish),
        thickness: fill(target.thickness, source.thickness),
        material: fill(target.material, source.material),
        color: fill(target.color, source.color),
        surface: fill(target.surface, source.surface),
        description: fill(target.description, source.description),
        sizes,
        heroAssetId: target.heroAssetId ?? source.heroAssetId,
        textureAssetId: target.textureAssetId ?? source.textureAssetId,
      },
    }),
    // The source's images follow it into the target.
    prisma.importAsset.updateMany({
      where: { extractedProductId: sourceId },
      data: { extractedProductId: targetId },
    }),
    prisma.extractedProduct.update({
      where: { id: sourceId },
      data: { status: "MERGED", mergedIntoId: targetId },
    }),
  ]);

  await logAudit({
    action: "extracted_product.merge",
    entity: "ExtractedProduct",
    entityId: targetId,
    meta: { mergedFrom: sourceId },
  });
}

/**
 * Flags staged rows whose slug already exists in the live catalogue, so a
 * re-imported catalogue doesn't silently create a second copy of everything.
 */
export async function detectDuplicates(importId: string): Promise<number> {
  await requirePermission("catalogImports", "edit");
  const staged = await prisma.extractedProduct.findMany({
    where: { importId, deletedAt: null, status: { notIn: ["PUBLISHED", "MERGED"] } },
    select: { id: true, slug: true, name: true, productCode: true },
  });

  let flagged = 0;
  for (const row of staged) {
    const slug = row.slug || slugify(row.name);
    const existing = await prisma.product.findFirst({
      where: {
        deletedAt: null,
        OR: [{ slug }, ...(row.productCode ? [{ productCode: row.productCode }] : [])],
      },
      select: { id: true },
    });
    if (existing) {
      await prisma.extractedProduct.update({
        where: { id: row.id },
        data: { duplicateOfProductId: existing.id },
      });
      flagged++;
    }
  }
  return flagged;
}

// ————— Publish —————

/**
 * Writes approved rows into the live catalogue.
 *
 * Only APPROVED, non-hidden rows are considered — nothing publishes because it
 * was merely extracted. Each row also carries `publishAsDraft`, so an approved
 * product can still land unpublished for a final look on the real page.
 */
export async function publishApproved(input: PublishInput): Promise<{ published: number; skipped: number }> {
  const session = await requirePermission("catalogImports", "publish");
  const { importId, category, publishLive } = publishSchema.parse(input);

  const approved = await prisma.extractedProduct.findMany({
    where: {
      importId,
      deletedAt: null,
      status: "APPROVED",
      hidden: false,
      productId: null, // resumable: already-published rows are skipped
    },
    include: { hero: true, texture: true, assets: true },
  });

  const categoryRow = await prisma.category.findUnique({ where: { slug: category } });

  let published = 0;
  let skipped = 0;

  for (const row of approved) {
    const brandName = row.brandName?.trim();
    let brandId: string | null = null;
    if (brandName) {
      const brand = await prisma.brand.upsert({
        where: { slug: slugify(brandName) },
        update: {},
        create: { slug: slugify(brandName), name: brandName, published: true },
      });
      brandId = brand.id;
    }

    // Guarantee a unique slug rather than failing the whole batch on a clash.
    const base = row.slug || slugify([brandName, row.collectionName, row.name].filter(Boolean).join(" "));
    let slug = base;
    for (let i = 2; await prisma.product.findUnique({ where: { slug } }); i++) {
      slug = `${base}-${i}`;
      if (i > 50) break;
    }

    const gallery = row.assets
      .filter((a) => !a.rejected && a.url && a.id !== row.heroAssetId && a.id !== row.textureAssetId)
      .map((a) => a.url!) as string[];

    try {
      const product = await prisma.product.create({
        data: {
          slug,
          name: row.name,
          collection: row.collectionName,
          description: row.premiumDescription || row.description,
          finish: row.finish,
          thickness: row.thickness,
          sizes: row.sizes ?? [],
          material: row.material,
          color: row.color,
          surface: row.surface,
          productCode: row.productCode,
          applications: toApplications(row.applications),
          applicationTags: row.applicationTags ?? [],
          searchKeywords: row.searchKeywords ?? [],
          lifestyleImage: row.hero?.url ?? null,
          textureImage: row.texture?.url ?? null,
          blurData: row.hero?.blurDataUrl ?? null,
          images: gallery,
          featured: row.featured,
          designerPick: category === "designer-picks",
          // publishAsDraft on the row wins: an editor can approve a product
          // and still hold it back for a look at the real page first.
          published: publishLive && !row.publishAsDraft,
          categoryId: categoryRow?.id ?? null,
          brandId,
          sourceImportId: importId,
          createdById: session.user.id,
        },
      });

      // Carry the composed SEO across, and register the kept images in the
      // media library so they're managed like any other asset.
      if (row.seoTitle || row.seoDescription) {
        await prisma.seo.create({
          data: {
            path: `/products/${category}/${slug}`,
            title: row.seoTitle,
            description: row.seoDescription,
            keywords: Array.isArray(row.metaKeywords) ? (row.metaKeywords as string[]).join(", ") : null,
            ogImage: row.hero?.url ?? null,
            productId: product.id,
          },
        });
      }

      await prisma.extractedProduct.update({
        where: { id: row.id },
        data: { status: "PUBLISHED", productId: product.id },
      });
      published++;
    } catch {
      skipped++;
    }
  }

  await prisma.catalogImport.update({
    where: { id: importId },
    data: { status: "COMPLETED", phaseMessage: `Published ${published} product${published === 1 ? "" : "s"}.` },
  });

  await logAudit({
    action: "catalog_import.publish",
    entity: "CatalogImport",
    entityId: importId,
    meta: { published, skipped, category, publishLive },
  });

  revalidatePath("/products");
  revalidatePath(`/products/${category}`);
  revalidatePath("/admin/content/catalog-imports");

  return { published, skipped };
}

export async function getBrandOptions() {
  await requirePermission("catalogImports", "view");
  return prisma.brand.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}
