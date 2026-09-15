"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { revalidateCategory } from "@/lib/revalidate-content";
import type { ListParams, ListResult } from "@/hooks/useAdminList";
import { categorySchema, type CategoryInput } from "./schema";
import type { Prisma } from "@prisma/client";
import { safeOrderBy, safePaging } from "@/lib/list-params";

export type CategoryRow = Prisma.CategoryGetPayload<{
  include: { parent: { select: { name: true } }; _count: { select: { products: true; children: true } } };
}>;

export async function listCategories(params: ListParams): Promise<ListResult<CategoryRow>> {
  await requirePermission("categories", "view");

  const where: Prisma.CategoryWhereInput = {
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
    prisma.category.findMany({
      where,
      include: { parent: { select: { name: true } }, _count: { select: { products: true, children: true } } },
      orderBy: safeOrderBy("Category", params.sortBy, params.sortDir, "sortOrder"),
      ...safePaging(params.page, params.pageSize),
    }),
    prisma.category.count({ where }),
  ]);

  return { rows, total };
}

export async function getCategoryOptions(excludeId?: string) {
  await requirePermission("categories", "view");
  const categories = await prisma.category.findMany({
    where: { deletedAt: null, ...(excludeId ? { id: { not: excludeId } } : {}) },
    select: { id: true, name: true, parentId: true },
    orderBy: { name: "asc" },
  });
  return categories;
}

export async function createCategory(input: CategoryInput) {
  const session = await requirePermission("categories", "create");
  const data = categorySchema.parse(input);

  const existing = await prisma.category.findUnique({ where: { slug: data.slug } });
  if (existing) throw new Error("A category with this slug already exists.");

  const category = await prisma.category.create({
    data: {
      ...data,
      image: data.image || null,
      bannerImage: data.bannerImage || null,
      icon: data.icon || null,
      description: data.description || null,
      parentId: data.parentId || null,
      createdById: session.user.id,
      updatedById: session.user.id,
    },
  });

  await logAudit({ action: "category.create", entity: "Category", entityId: category.id, newValue: category });
  await revalidateCategoryById(category.id);
  return category;
}

export async function updateCategory(id: string, input: CategoryInput) {
  const session = await requirePermission("categories", "edit");
  const data = categorySchema.parse(input);

  if (data.parentId === id) throw new Error("A category cannot be its own parent.");

  const before = await prisma.category.findUniqueOrThrow({ where: { id } });
  const duplicate = await prisma.category.findFirst({ where: { slug: data.slug, id: { not: id } } });
  if (duplicate) throw new Error("A category with this slug already exists.");

  const category = await prisma.category.update({
    where: { id },
    data: {
      ...data,
      image: data.image || null,
      bannerImage: data.bannerImage || null,
      icon: data.icon || null,
      description: data.description || null,
      parentId: data.parentId || null,
      updatedById: session.user.id,
    },
  });

  await logAudit({
    action: "category.update",
    entity: "Category",
    entityId: id,
    oldValue: before,
    newValue: category,
  });
  await revalidateCategoryById(id);
  return category;
}

export async function softDeleteCategory(id: string) {
  const session = await requirePermission("categories", "delete");
  const category = await prisma.category.update({
    where: { id },
    data: { deletedAt: new Date(), deletedById: session.user.id },
  });
  await logAudit({ action: "category.delete", entity: "Category", entityId: id });
  return category;
}

/** Swaps `sortOrder` with the adjacent sibling *within the same parent* — a bathware child reorders independently of top-level categories. */
export async function reorderCategory(id: string, direction: "up" | "down") {
  const session = await requirePermission("categories", "edit");

  const current = await prisma.category.findUniqueOrThrow({ where: { id } });
  const sibling = await prisma.category.findFirst({
    where: {
      deletedAt: null,
      parentId: current.parentId,
      sortOrder: direction === "up" ? { lt: current.sortOrder } : { gt: current.sortOrder },
    },
    orderBy: { sortOrder: direction === "up" ? "desc" : "asc" },
  });
  if (!sibling) return current;

  await prisma.$transaction([
    prisma.category.update({ where: { id: current.id }, data: { sortOrder: sibling.sortOrder, updatedById: session.user.id } }),
    prisma.category.update({ where: { id: sibling.id }, data: { sortOrder: current.sortOrder, updatedById: session.user.id } }),
  ]);

  await logAudit({ action: "category.reorder", entity: "Category", entityId: id, meta: { direction } });
  return current;
}

export async function restoreCategory(id: string) {
  const session = await requirePermission("categories", "edit");
  const category = await prisma.category.update({
    where: { id },
    data: { deletedAt: null, deletedById: null },
  });
  await logAudit({ action: "category.restore", entity: "Category", entityId: id, meta: { by: session.user.id } });
  return category;
}

/** Refresh the section pages a category's imagery appears on. */
async function revalidateCategoryById(id: string) {
  const row = await prisma.category.findUnique({
    where: { id },
    select: { slug: true, parent: { select: { slug: true, parent: { select: { slug: true } } } } },
  });
  if (!row) return;
  const section = row.parent?.parent?.slug ?? row.parent?.slug ?? row.slug;
  revalidateCategory(row.slug, section);
}
