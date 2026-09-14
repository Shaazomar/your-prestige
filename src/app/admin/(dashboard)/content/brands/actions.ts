"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import type { ListParams, ListResult } from "@/hooks/useAdminList";
import { brandSchema, type BrandInput } from "./schema";
import type { Prisma } from "@prisma/client";
import { safeOrderBy, safePaging } from "@/lib/list-params";

export type BrandRow = Prisma.BrandGetPayload<{ include: { _count: { select: { products: true } } } }> & {
  categoryCount: number;
};

export async function listBrands(params: ListParams): Promise<ListResult<BrandRow>> {
  await requirePermission("brands", "view");

  const where: Prisma.BrandWhereInput = {
    deletedAt: params.trash ? { not: null } : null,
    ...(params.search
      ? { OR: [{ name: { contains: params.search, mode: "insensitive" } }, { slug: { contains: params.search, mode: "insensitive" } }] }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.brand.findMany({
      where,
      include: { _count: { select: { products: true } } },
      orderBy: safeOrderBy("Brand", params.sortBy, params.sortDir, "sortOrder"),
      ...safePaging(params.page, params.pageSize),
    }),
    prisma.brand.count({ where }),
  ]);

  const categoryRows = rows.length
    ? await prisma.product.groupBy({
        by: ["brandId", "categoryId"],
        where: { deletedAt: null, brandId: { in: rows.map((r) => r.id) }, categoryId: { not: null } },
      })
    : [];
  const distinctCategoriesByBrand = new Map<string, Set<string>>();
  for (const r of categoryRows) {
    if (!r.brandId || !r.categoryId) continue;
    if (!distinctCategoriesByBrand.has(r.brandId)) distinctCategoriesByBrand.set(r.brandId, new Set());
    distinctCategoriesByBrand.get(r.brandId)!.add(r.categoryId);
  }

  return {
    rows: rows.map((r) => ({ ...r, categoryCount: distinctCategoriesByBrand.get(r.id)?.size ?? 0 })),
    total,
  };
}

function toBrandData(data: BrandInput) {
  return {
    ...data,
    logo: data.logo || null,
    banner: data.banner || null,
    mobileCoverImage: data.mobileCoverImage || null,
    heroVideo: data.heroVideo || null,
    heroPoster: data.heroPoster || null,
    description: data.description || null,
    shortDescription: data.shortDescription || null,
    website: data.website || null,
    catalogPdf: data.catalogPdf || null,
    featuredProductIds: data.featuredProductIds,
  };
}

export async function createBrand(input: BrandInput) {
  const session = await requirePermission("brands", "create");
  const data = brandSchema.parse(input);

  const existing = await prisma.brand.findUnique({ where: { slug: data.slug } });
  if (existing) throw new Error("A brand with this slug already exists.");

  const brand = await prisma.brand.create({
    data: {
      ...toBrandData(data),
      createdById: session.user.id,
      updatedById: session.user.id,
    },
  });

  await logAudit({ action: "brand.create", entity: "Brand", entityId: brand.id, newValue: brand });
  return brand;
}

export async function updateBrand(id: string, input: BrandInput) {
  const session = await requirePermission("brands", "edit");
  const data = brandSchema.parse(input);

  const before = await prisma.brand.findUniqueOrThrow({ where: { id } });
  const duplicate = await prisma.brand.findFirst({ where: { slug: data.slug, id: { not: id } } });
  if (duplicate) throw new Error("A brand with this slug already exists.");

  const brand = await prisma.brand.update({
    where: { id },
    data: {
      ...toBrandData(data),
      updatedById: session.user.id,
    },
  });

  await logAudit({ action: "brand.update", entity: "Brand", entityId: id, oldValue: before, newValue: brand });
  return brand;
}

/** This brand's own products, for the Featured Products checklist — never the whole catalogue. */
export async function getBrandProductOptions(brandId: string) {
  await requirePermission("brands", "view");
  return prisma.product.findMany({
    where: { brandId, deletedAt: null },
    select: { id: true, name: true, collection: true },
    orderBy: { name: "asc" },
  });
}

/** Swaps `sortOrder` with the adjacent sibling — the whole "reorder" mechanic, no drag-and-drop dependency needed. */
export async function reorderBrand(id: string, direction: "up" | "down") {
  const session = await requirePermission("brands", "edit");

  const current = await prisma.brand.findUniqueOrThrow({ where: { id } });
  const sibling = await prisma.brand.findFirst({
    where: {
      deletedAt: null,
      sortOrder: direction === "up" ? { lt: current.sortOrder } : { gt: current.sortOrder },
    },
    orderBy: { sortOrder: direction === "up" ? "desc" : "asc" },
  });
  if (!sibling) return current;

  await prisma.$transaction([
    prisma.brand.update({ where: { id: current.id }, data: { sortOrder: sibling.sortOrder, updatedById: session.user.id } }),
    prisma.brand.update({ where: { id: sibling.id }, data: { sortOrder: current.sortOrder, updatedById: session.user.id } }),
  ]);

  await logAudit({ action: "brand.reorder", entity: "Brand", entityId: id, meta: { direction } });
  return current;
}

export async function softDeleteBrand(id: string) {
  const session = await requirePermission("brands", "delete");
  const brand = await prisma.brand.update({
    where: { id },
    data: { deletedAt: new Date(), deletedById: session.user.id },
  });
  await logAudit({ action: "brand.delete", entity: "Brand", entityId: id });
  return brand;
}

export async function restoreBrand(id: string) {
  await requirePermission("brands", "edit");
  const brand = await prisma.brand.update({ where: { id }, data: { deletedAt: null, deletedById: null } });
  await logAudit({ action: "brand.restore", entity: "Brand", entityId: id });
  return brand;
}
