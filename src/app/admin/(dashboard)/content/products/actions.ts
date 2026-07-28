"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import type { ListParams, ListResult } from "@/hooks/useAdminList";
import { productSchema, type ProductInput } from "./schema";
import type { Prisma } from "@prisma/client";

export type ProductRow = Prisma.ProductGetPayload<{
  include: { category: { select: { name: true } }; brand: { select: { name: true } } };
}>;

export async function listProducts(params: ListParams): Promise<ListResult<ProductRow>> {
  await requirePermission("products", "view");

  const where: Prisma.ProductWhereInput = {
    deletedAt: params.trash ? { not: null } : null,
    ...(params.search
      ? {
          OR: [
            { name: { contains: params.search, mode: "insensitive" } },
            { slug: { contains: params.search, mode: "insensitive" } },
            { collection: { contains: params.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: { select: { name: true } }, brand: { select: { name: true } } },
      orderBy: { [params.sortBy]: params.sortDir },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
    }),
    prisma.product.count({ where }),
  ]);

  return { rows, total };
}

export async function getProductFormOptions(excludeId?: string) {
  await requirePermission("products", "view");
  const [categories, brands, products] = await Promise.all([
    prisma.category.findMany({ where: { deletedAt: null }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.brand.findMany({ where: { deletedAt: null }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.product.findMany({
      where: { deletedAt: null, ...(excludeId ? { id: { not: excludeId } } : {}) },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);
  return { categories, brands, products };
}

export async function createProduct(input: ProductInput) {
  const session = await requirePermission("products", "create");
  const data = productSchema.parse(input);

  const existing = await prisma.product.findUnique({ where: { slug: data.slug } });
  if (existing) throw new Error("A product with this slug already exists.");

  const product = await prisma.product.create({
    data: {
      ...data,
      collection: data.collection || null,
      description: data.description || null,
      finish: data.finish || null,
      thickness: data.thickness || null,
      material: data.material || null,
      color: data.color || null,
      texture: data.texture || null,
      lifestyleImage: data.lifestyleImage || null,
      textureImage: data.textureImage || null,
      video: data.video || null,
      brochureUrl: data.brochureUrl || null,
      tag: data.tag || null,
      priceIndicator: data.priceIndicator || null,
      categoryId: data.categoryId || null,
      brandId: data.brandId || null,
      createdById: session.user.id,
      updatedById: session.user.id,
    },
  });

  await logAudit({ action: "product.create", entity: "Product", entityId: product.id, newValue: product });
  return product;
}

export async function updateProduct(id: string, input: ProductInput) {
  const session = await requirePermission("products", "edit");
  const data = productSchema.parse(input);

  const before = await prisma.product.findUniqueOrThrow({ where: { id } });
  const duplicate = await prisma.product.findFirst({ where: { slug: data.slug, id: { not: id } } });
  if (duplicate) throw new Error("A product with this slug already exists.");

  const product = await prisma.product.update({
    where: { id },
    data: {
      ...data,
      collection: data.collection || null,
      description: data.description || null,
      finish: data.finish || null,
      thickness: data.thickness || null,
      material: data.material || null,
      color: data.color || null,
      texture: data.texture || null,
      lifestyleImage: data.lifestyleImage || null,
      textureImage: data.textureImage || null,
      video: data.video || null,
      brochureUrl: data.brochureUrl || null,
      tag: data.tag || null,
      priceIndicator: data.priceIndicator || null,
      categoryId: data.categoryId || null,
      brandId: data.brandId || null,
      updatedById: session.user.id,
    },
  });

  await logAudit({ action: "product.update", entity: "Product", entityId: id, oldValue: before, newValue: product });
  return product;
}

export async function softDeleteProduct(id: string) {
  const session = await requirePermission("products", "delete");
  const product = await prisma.product.update({
    where: { id },
    data: { deletedAt: new Date(), deletedById: session.user.id },
  });
  await logAudit({ action: "product.delete", entity: "Product", entityId: id });
  return product;
}

export async function restoreProduct(id: string) {
  await requirePermission("products", "edit");
  const product = await prisma.product.update({ where: { id }, data: { deletedAt: null, deletedById: null } });
  await logAudit({ action: "product.restore", entity: "Product", entityId: id });
  return product;
}

export async function bulkDeleteProducts(ids: string[]) {
  const session = await requirePermission("products", "delete");
  await prisma.product.updateMany({
    where: { id: { in: ids } },
    data: { deletedAt: new Date(), deletedById: session.user.id },
  });
  await logAudit({ action: "product.bulk_delete", entity: "Product", meta: { ids } });
}
