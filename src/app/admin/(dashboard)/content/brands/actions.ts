"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import type { ListParams, ListResult } from "@/hooks/useAdminList";
import { brandSchema, type BrandInput } from "./schema";
import type { Prisma } from "@prisma/client";

export type BrandRow = Prisma.BrandGetPayload<{ include: { _count: { select: { products: true } } } }>;

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
      orderBy: { [params.sortBy]: params.sortDir },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
    }),
    prisma.brand.count({ where }),
  ]);

  return { rows, total };
}

export async function createBrand(input: BrandInput) {
  const session = await requirePermission("brands", "create");
  const data = brandSchema.parse(input);

  const existing = await prisma.brand.findUnique({ where: { slug: data.slug } });
  if (existing) throw new Error("A brand with this slug already exists.");

  const brand = await prisma.brand.create({
    data: {
      ...data,
      logo: data.logo || null,
      banner: data.banner || null,
      description: data.description || null,
      website: data.website || null,
      catalogPdf: data.catalogPdf || null,
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
      ...data,
      logo: data.logo || null,
      banner: data.banner || null,
      description: data.description || null,
      website: data.website || null,
      catalogPdf: data.catalogPdf || null,
      updatedById: session.user.id,
    },
  });

  await logAudit({ action: "brand.update", entity: "Brand", entityId: id, oldValue: before, newValue: brand });
  return brand;
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
