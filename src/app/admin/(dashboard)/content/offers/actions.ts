"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import type { ListParams, ListResult } from "@/hooks/useAdminList";
import { offerSchema, type OfferInput } from "./schema";
import type { Prisma } from "@prisma/client";

export type OfferRow = Prisma.OfferGetPayload<{
  include: {
    product: { select: { name: true } };
    collection: { select: { name: true } };
    category: { select: { name: true } };
  };
}>;

export async function listOffers(params: ListParams): Promise<ListResult<OfferRow>> {
  await requirePermission("offers", "view");

  const where: Prisma.OfferWhereInput = {
    deletedAt: params.trash ? { not: null } : null,
    ...(params.search ? { name: { contains: params.search, mode: "insensitive" } } : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.offer.findMany({
      where,
      include: {
        product: { select: { name: true } },
        collection: { select: { name: true } },
        category: { select: { name: true } },
      },
      orderBy: { [params.sortBy]: params.sortDir },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
    }),
    prisma.offer.count({ where }),
  ]);
  return { rows, total };
}

export async function getOfferFormOptions() {
  await requirePermission("offers", "view");
  const [products, collections, categories] = await Promise.all([
    prisma.product.findMany({ where: { deletedAt: null }, select: { id: true, name: true, price: true }, orderBy: { name: "asc" } }),
    prisma.collection.findMany({ where: { deletedAt: null }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.category.findMany({ where: { deletedAt: null }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return {
    products: products.map(p => ({ id: p.id, name: p.name, price: p.price ? Number(p.price) : null })),
    collections,
    categories,
  };
}

function toData(data: OfferInput) {
  return {
    name: data.name,
    type: data.type,
    productId: data.productId || null,
    collectionId: data.collectionId || null,
    categoryId: data.categoryId || null,
    originalPrice: data.originalPrice || null,
    offerPrice: data.offerPrice || null,
    discountPercentage: data.discountPercentage || null,
    startDate: data.startDate ? new Date(data.startDate) : null,
    endDate: data.endDate ? new Date(data.endDate) : null,
    banner: data.banner || null,
    description: data.description || null,
    status: data.status,
    priority: data.priority,
    featured: data.featured,
  };
}

export async function createOffer(input: OfferInput) {
  const session = await requirePermission("offers", "create");
  const data = offerSchema.parse(input);
  const offer = await prisma.offer.create({ data: { ...toData(data), createdById: session.user.id } });
  await logAudit({ action: "offer.create", entity: "Offer", entityId: offer.id, newValue: offer });
  return offer;
}

export async function updateOffer(id: string, input: OfferInput) {
  await requirePermission("offers", "edit");
  const data = offerSchema.parse(input);
  const before = await prisma.offer.findUniqueOrThrow({ where: { id } });
  const offer = await prisma.offer.update({ where: { id }, data: toData(data) });
  await logAudit({ action: "offer.update", entity: "Offer", entityId: id, oldValue: before, newValue: offer });
  return offer;
}

export async function softDeleteOffer(id: string) {
  const session = await requirePermission("offers", "delete");
  const offer = await prisma.offer.update({ where: { id }, data: { deletedAt: new Date() } });
  await logAudit({ action: "offer.delete", entity: "Offer", entityId: id, meta: { by: session.user.id } });
  return offer;
}

export async function restoreOffer(id: string) {
  await requirePermission("offers", "edit");
  const offer = await prisma.offer.update({ where: { id }, data: { deletedAt: null } });
  await logAudit({ action: "offer.restore", entity: "Offer", entityId: id });
  return offer;
}

export async function duplicateOffer(id: string) {
  const session = await requirePermission("offers", "create");
  const source = await prisma.offer.findUniqueOrThrow({ where: { id } });

  const duplicated = await prisma.offer.create({
    data: {
      name: `${source.name} (Copy)`,
      type: source.type,
      productId: source.productId,
      collectionId: source.collectionId,
      categoryId: source.categoryId,
      originalPrice: source.originalPrice,
      offerPrice: source.offerPrice,
      discountPercentage: source.discountPercentage,
      startDate: source.startDate,
      endDate: source.endDate,
      banner: source.banner,
      description: source.description,
      status: "INACTIVE",
      priority: source.priority,
      featured: source.featured,
      createdById: session.user.id,
    },
  });

  await logAudit({ action: "offer.duplicate", entity: "Offer", entityId: duplicated.id, newValue: duplicated });
  return duplicated;
}

export async function toggleOfferStatus(id: string, status: "ACTIVE" | "INACTIVE" | "SCHEDULED") {
  await requirePermission("offers", "edit");
  const offer = await prisma.offer.update({
    where: { id },
    data: { status },
  });
  await logAudit({ action: "offer.status_change", entity: "Offer", entityId: id, meta: { status } });
  return offer;
}

