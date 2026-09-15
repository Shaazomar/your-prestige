"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { revalidateCollection } from "@/lib/revalidate-content";
import type { ListParams, ListResult } from "@/hooks/useAdminList";
import { collectionSchema, type CollectionInput } from "./schema";
import type { Prisma } from "@prisma/client";
import { safeOrderBy, safePaging } from "@/lib/list-params";

export type CollectionRow = Prisma.CollectionGetPayload<{
  include: { _count: { select: { products: true } }; brand: { select: { name: true } } };
}>;

export async function listCollections(params: ListParams): Promise<ListResult<CollectionRow>> {
  await requirePermission("collections", "view");

  const where: Prisma.CollectionWhereInput = {
    deletedAt: params.trash ? { not: null } : null,
    ...(params.search
      ? {
          OR: [
            { name: { contains: params.search, mode: "insensitive" } },
            { slug: { contains: params.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.collection.findMany({
      where,
      include: { _count: { select: { products: true } }, brand: { select: { name: true } } },
      orderBy: safeOrderBy("Collection", params.sortBy, params.sortDir, "sortOrder"),
      ...safePaging(params.page, params.pageSize),
    }),
    prisma.collection.count({ where }),
  ]);

  return { rows, total };
}

export async function getCollectionOptions() {
  await requirePermission("collections", "view");
  const collections = await prisma.collection.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  return collections;
}

/** Brands to assign a Collection to, for the brand-scoped "Featured Collections" feature. */
export async function getCollectionBrandOptions() {
  await requirePermission("collections", "view");
  return prisma.brand.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

/** Products to assign to this Collection — scoped to the collection's brand when it has one, otherwise every product. */
export async function getCollectionProductOptions(brandId?: string | null) {
  await requirePermission("collections", "view");
  return prisma.product.findMany({
    where: { deletedAt: null, ...(brandId ? { brandId } : {}) },
    select: { id: true, name: true, collection: true },
    orderBy: { name: "asc" },
  });
}

/** Product ids currently in this collection — the checklist's initial selection. */
export async function getCollectionProductIds(collectionId: string) {
  await requirePermission("collections", "view");
  const rows = await prisma.product.findMany({
    where: { collectionId },
    select: { id: true },
  });
  return rows.map((r) => r.id);
}

/**
 * Replaces this Collection's product membership in one go. A pure join-table
 * operation (`products: { set: [...] }`) — it never creates, deletes or
 * otherwise touches a Product row itself, so it can't duplicate or modify
 * catalogue data.
 */
export async function setCollectionProducts(collectionId: string, productIds: string[]) {
  const session = await requirePermission("collections", "edit");
  await prisma.collection.update({
    where: { id: collectionId },
    data: { products: { set: productIds.map((id) => ({ id })) } },
  });
  await logAudit({
    action: "collection.setProducts",
    entity: "Collection",
    entityId: collectionId,
    meta: { by: session.user.id, count: productIds.length },
  });
}

function toCollectionData(data: CollectionInput) {
  return {
    name: data.name,
    slug: data.slug,
    description: data.description || null,
    image: data.image || null,
    sortOrder: data.sortOrder,
    published: data.published,
    brandId: data.brandId || null,
  };
}

export async function createCollection(input: CollectionInput) {
  const session = await requirePermission("collections", "create");
  const data = collectionSchema.parse(input);

  const existing = await prisma.collection.findUnique({ where: { slug: data.slug } });
  if (existing) throw new Error("A collection with this slug already exists.");

  const collection = await prisma.collection.create({
    data: {
      ...toCollectionData(data),
      createdById: session.user.id,
      updatedById: session.user.id,
    },
  });

  await logAudit({ action: "collection.create", entity: "Collection", entityId: collection.id, newValue: collection });
  revalidateCollection(collection.slug);
  return collection;
}

export async function updateCollection(id: string, input: CollectionInput) {
  const session = await requirePermission("collections", "edit");
  const data = collectionSchema.parse(input);

  const before = await prisma.collection.findUniqueOrThrow({ where: { id } });
  const duplicate = await prisma.collection.findFirst({ where: { slug: data.slug, id: { not: id } } });
  if (duplicate) throw new Error("A collection with this slug already exists.");

  const collection = await prisma.collection.update({
    where: { id },
    data: {
      ...toCollectionData(data),
      updatedById: session.user.id,
    },
  });

  await logAudit({
    action: "collection.update",
    entity: "Collection",
    entityId: id,
    oldValue: before,
    newValue: collection,
  });
  revalidateCollection(collection.slug);
  return collection;
}

export async function softDeleteCollection(id: string) {
  const session = await requirePermission("collections", "delete");
  const collection = await prisma.collection.update({
    where: { id },
    data: { deletedAt: new Date(), deletedById: session.user.id },
  });
  await logAudit({ action: "collection.delete", entity: "Collection", entityId: id });
  return collection;
}

export async function restoreCollection(id: string) {
  const session = await requirePermission("collections", "edit");
  const collection = await prisma.collection.update({
    where: { id },
    data: { deletedAt: null, deletedById: null },
  });
  await logAudit({ action: "collection.restore", entity: "Collection", entityId: id, meta: { by: session.user.id } });
  return collection;
}
