"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { classifyCatalog } from "@/lib/catalog-classifier";
import type { ListParams, ListResult } from "@/hooks/useAdminList";
import { safePaging } from "@/lib/list-params";
import type { Prisma } from "@prisma/client";
import { resolveImageRef } from "@/lib/s3-url";

export interface ReviewRow {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  productCode: string | null;
  collection: string | null;
  brandName: string | null;
  categoryPath: string | null;
  needsReview: boolean;
  reviewReason: string | null;
  thumbUrl: string | null;
}

/** Products the classifier could not place confidently, newest doubt first. */
export async function listNeedsReview(
  params: ListParams & { onlyUncategorised?: boolean }
): Promise<ListResult<ReviewRow>> {
  await requirePermission("products", "view");

  const where: Prisma.ProductWhereInput = {
    deletedAt: null,
    needsReview: true,
    ...(params.onlyUncategorised ? { categoryId: null } : {}),
    ...(params.search
      ? {
          OR: [
            { name: { contains: params.search, mode: "insensitive" } },
            { sku: { contains: params.search, mode: "insensitive" } },
            { productCode: { contains: params.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.product.findMany({
      where,
      select: {
        id: true, name: true, slug: true, sku: true, productCode: true,
        collection: true, needsReview: true, reviewReason: true,
        lifestyleImage: true, image_key: true, thumbnail_key: true,
        brand: { select: { name: true } },
        category: { select: { name: true, parent: { select: { name: true } } } },
      },
      orderBy: { updatedAt: "desc" },
      ...safePaging(params.page, params.pageSize),
    }),
    prisma.product.count({ where }),
  ]);

  return {
    rows: rows.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      sku: r.sku,
      productCode: r.productCode,
      collection: r.collection,
      brandName: r.brand?.name ?? null,
      categoryPath: r.category
        ? [r.category.parent?.name, r.category.name].filter(Boolean).join(" › ")
        : null,
      needsReview: r.needsReview,
      reviewReason: r.reviewReason,
      thumbUrl:
        resolveImageRef(r.lifestyleImage) || resolveImageRef(r.image_key) || resolveImageRef(r.thumbnail_key),
    })),
    total,
  };
}

/** Headline numbers for the queue. One grouped query, not four counts. */
export async function getClassificationStats() {
  await requirePermission("products", "view");

  const [total, uncategorised, needsReview, categorised] = await Promise.all([
    prisma.product.count({ where: { deletedAt: null } }),
    prisma.product.count({ where: { deletedAt: null, categoryId: null } }),
    prisma.product.count({ where: { deletedAt: null, needsReview: true } }),
    prisma.product.count({ where: { deletedAt: null, categoryId: { not: null } } }),
  ]);

  return { total, uncategorised, needsReview, categorised };
}

/** Category options as readable paths, for the inline picker. */
export async function getClassificationOptions() {
  await requirePermission("products", "view");
  const [categoryRows, brands] = await Promise.all([
    prisma.category.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true, parentId: true },
    }),
    prisma.brand.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const byId = new Map(categoryRows.map((c) => [c.id, c]));
  const pathOf = (id: string): string => {
    const parts: string[] = [];
    const guard = new Set<string>();
    let cursor = byId.get(id);
    while (cursor && !guard.has(cursor.id)) {
      guard.add(cursor.id);
      parts.unshift(cursor.name);
      cursor = cursor.parentId ? byId.get(cursor.parentId) : undefined;
    }
    return parts.join(" › ");
  };

  return {
    categories: categoryRows
      .map((c) => ({ id: c.id, name: pathOf(c.id) }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    brands,
  };
}

/**
 * A person's decision. Marks the product MANUAL, which permanently excludes it
 * from the classifier — re-running the classifier can never undo this.
 */
export async function resolveClassification(
  productId: string,
  input: { categoryId?: string | null; brandId?: string | null }
) {
  const session = await requirePermission("products", "edit");

  const before = await prisma.product.findUniqueOrThrow({
    where: { id: productId },
    select: { id: true, categoryId: true, brandId: true, needsReview: true },
  });

  const product = await prisma.product.update({
    where: { id: productId },
    data: {
      ...(input.categoryId !== undefined ? { categoryId: input.categoryId || null } : {}),
      ...(input.brandId !== undefined ? { brandId: input.brandId || null } : {}),
      // A person has decided, so it is no longer waiting on anyone. The
      // classifier only ever looks at products with no category, so filing one
      // here also puts it permanently out of its reach.
      needsReview: false,
      reviewReason: null,
      updatedById: session.user.id,
    },
  });

  await logAudit({
    action: "product.classify",
    entity: "Product",
    entityId: productId,
    oldValue: before,
    newValue: { categoryId: product.categoryId, brandId: product.brandId, needsReview: product.needsReview },
  });

  return { ok: true };
}

/**
 * Run the classifier from the CMS.
 *
 * Dry run by default so an operator sees the numbers before anything is
 * written, matching the CLI.
 */
export async function runClassifier(apply: boolean) {
  await requirePermission("products", "edit");

  const { report } = await classifyCatalog({ apply });

  if (apply) {
    await logAudit({
      action: "catalog.classify_run",
      entity: "Product",
      meta: { ...report },
    });
  }

  return report;
}
