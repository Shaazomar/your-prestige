"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import type { ListParams, ListResult } from "@/hooks/useAdminList";
import { collectionSchema, type CollectionInput } from "./schema";
import type { Prisma } from "@prisma/client";

export type CollectionRow = Prisma.CollectionGetPayload<{
  include: { _count: { select: { products: true } } };
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
      include: { _count: { select: { products: true } } },
      orderBy: { [params.sortBy]: params.sortDir },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
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

export async function createCollection(input: CollectionInput) {
  const session = await requirePermission("collections", "create");
  const data = collectionSchema.parse(input);

  const existing = await prisma.collection.findUnique({ where: { slug: data.slug } });
  if (existing) throw new Error("A collection with this slug already exists.");

  const collection = await prisma.collection.create({
    data: {
      ...data,
      image: data.image || null,
      description: data.description || null,
      createdById: session.user.id,
      updatedById: session.user.id,
    },
  });

  await logAudit({ action: "collection.create", entity: "Collection", entityId: collection.id, newValue: collection });
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
      ...data,
      image: data.image || null,
      description: data.description || null,
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
