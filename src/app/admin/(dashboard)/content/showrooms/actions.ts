"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import type { ListParams, ListResult } from "@/hooks/useAdminList";
import { showroomSchema, type ShowroomInput } from "./schema";
import type { Prisma, Showroom } from "@prisma/client";

export type ShowroomRow = Showroom;

export async function listShowrooms(params: ListParams): Promise<ListResult<ShowroomRow>> {
  await requirePermission("showrooms", "view");

  const where: Prisma.ShowroomWhereInput = {
    deletedAt: params.trash ? { not: null } : null,
    ...(params.search
      ? {
          OR: [
            { name: { contains: params.search, mode: "insensitive" } },
            { city: { contains: params.search, mode: "insensitive" } },
            { locality: { contains: params.search, mode: "insensitive" } },
            { addressLine: { contains: params.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.showroom.findMany({
      where,
      orderBy: { [params.sortBy]: params.sortDir },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
    }),
    prisma.showroom.count({ where }),
  ]);

  return { rows, total };
}

/** Product picker options for the "featured products" field. */
export async function getShowroomProductOptions() {
  await requirePermission("showrooms", "view");
  return prisma.product.findMany({
    where: { deletedAt: null, published: true },
    select: { id: true, name: true, collection: true },
    orderBy: { name: "asc" },
  });
}

function toData(data: ShowroomInput) {
  return {
    ...data,
    subtitle: data.subtitle || null,
    locality: data.locality || null,
    postalCode: data.postalCode || null,
    latitude: data.latitude ?? null,
    longitude: data.longitude ?? null,
    mapUrl: data.mapUrl || null,
    mapEmbedUrl: data.mapEmbedUrl || null,
    directions: data.directions || null,
    whatsapp: data.whatsapp || null,
    email: data.email || null,
    managerName: data.managerName || null,
    managerPhone: data.managerPhone || null,
    heroImage: data.heroImage || null,
    video: data.video || null,
    description: data.description || null,
  };
}

/** Public showroom pages are ISR-cached; bust them whenever content changes. */
function revalidateShowrooms(slug?: string) {
  revalidatePath("/showrooms");
  revalidatePath("/");
  if (slug) revalidatePath(`/showrooms/${slug}`);
}

export async function createShowroom(input: ShowroomInput) {
  const session = await requirePermission("showrooms", "create");
  const data = showroomSchema.parse(input);

  const existing = await prisma.showroom.findUnique({ where: { slug: data.slug } });
  if (existing) throw new Error("A showroom with this slug already exists.");

  const showroom = await prisma.showroom.create({
    data: { ...toData(data), createdById: session.user.id, updatedById: session.user.id },
  });

  await logAudit({
    action: "showroom.create",
    entity: "Showroom",
    entityId: showroom.id,
    newValue: showroom,
  });
  revalidateShowrooms(showroom.slug);
  return showroom;
}

export async function updateShowroom(id: string, input: ShowroomInput) {
  const session = await requirePermission("showrooms", "edit");
  const data = showroomSchema.parse(input);

  const before = await prisma.showroom.findUniqueOrThrow({ where: { id } });
  const duplicate = await prisma.showroom.findFirst({
    where: { slug: data.slug, id: { not: id } },
  });
  if (duplicate) throw new Error("A showroom with this slug already exists.");

  const showroom = await prisma.showroom.update({
    where: { id },
    data: { ...toData(data), updatedById: session.user.id },
  });

  await logAudit({
    action: "showroom.update",
    entity: "Showroom",
    entityId: id,
    oldValue: before,
    newValue: showroom,
  });
  revalidateShowrooms(showroom.slug);
  if (before.slug !== showroom.slug) revalidatePath(`/showrooms/${before.slug}`);
  return showroom;
}

export async function softDeleteShowroom(id: string) {
  const session = await requirePermission("showrooms", "delete");
  const showroom = await prisma.showroom.update({
    where: { id },
    data: { deletedAt: new Date(), deletedById: session.user.id },
  });
  await logAudit({ action: "showroom.delete", entity: "Showroom", entityId: id });
  revalidateShowrooms(showroom.slug);
  return showroom;
}

export async function restoreShowroom(id: string) {
  await requirePermission("showrooms", "edit");
  const showroom = await prisma.showroom.update({
    where: { id },
    data: { deletedAt: null, deletedById: null },
  });
  await logAudit({ action: "showroom.restore", entity: "Showroom", entityId: id });
  revalidateShowrooms(showroom.slug);
  return showroom;
}
