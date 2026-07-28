"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import type { ListParams, ListResult } from "@/hooks/useAdminList";
import { offerSchema, type OfferInput } from "./schema";
import type { Prisma, Offer } from "@prisma/client";

export async function listOffers(params: ListParams): Promise<ListResult<Offer>> {
  await requirePermission("offers", "view");

  const where: Prisma.OfferWhereInput = {
    deletedAt: params.trash ? { not: null } : null,
    ...(params.search ? { title: { contains: params.search, mode: "insensitive" } } : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.offer.findMany({ where, orderBy: { [params.sortBy]: params.sortDir }, skip: (params.page - 1) * params.pageSize, take: params.pageSize }),
    prisma.offer.count({ where }),
  ]);
  return { rows, total };
}

function toData(data: OfferInput) {
  return {
    ...data,
    description: data.description || null,
    image: data.image || null,
    validFrom: data.validFrom ? new Date(data.validFrom) : null,
    validUntil: data.validUntil ? new Date(data.validUntil) : null,
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
