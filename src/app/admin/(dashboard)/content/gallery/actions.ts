"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import type { ListParams, ListResult } from "@/hooks/useAdminList";
import { albumSchema, type AlbumInput } from "./schema";
import type { Prisma } from "@prisma/client";

export type AlbumRow = Prisma.GalleryAlbumGetPayload<{ include: { _count: { select: { items: true } } } }>;
export type GalleryItemRow = Prisma.GalleryItemGetPayload<Record<string, never>>;

export async function listAlbums(params: ListParams): Promise<ListResult<AlbumRow>> {
  await requirePermission("gallery", "view");

  const where: Prisma.GalleryAlbumWhereInput = {
    deletedAt: params.trash ? { not: null } : null,
    ...(params.search ? { title: { contains: params.search, mode: "insensitive" } } : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.galleryAlbum.findMany({
      where,
      include: { _count: { select: { items: true } } },
      orderBy: { [params.sortBy]: params.sortDir },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
    }),
    prisma.galleryAlbum.count({ where }),
  ]);

  return { rows, total };
}

export async function createAlbum(input: AlbumInput) {
  const session = await requirePermission("gallery", "create");
  const data = albumSchema.parse(input);

  const existing = await prisma.galleryAlbum.findUnique({ where: { slug: data.slug } });
  if (existing) throw new Error("An album with this slug already exists.");

  const album = await prisma.galleryAlbum.create({
    data: { ...data, coverImage: data.coverImage || null, description: data.description || null, createdById: session.user.id },
  });
  await logAudit({ action: "gallery_album.create", entity: "GalleryAlbum", entityId: album.id, newValue: album });
  return album;
}

export async function updateAlbum(id: string, input: AlbumInput) {
  await requirePermission("gallery", "edit");
  const data = albumSchema.parse(input);

  const before = await prisma.galleryAlbum.findUniqueOrThrow({ where: { id } });
  const duplicate = await prisma.galleryAlbum.findFirst({ where: { slug: data.slug, id: { not: id } } });
  if (duplicate) throw new Error("An album with this slug already exists.");

  const album = await prisma.galleryAlbum.update({
    where: { id },
    data: { ...data, coverImage: data.coverImage || null, description: data.description || null },
  });
  await logAudit({ action: "gallery_album.update", entity: "GalleryAlbum", entityId: id, oldValue: before, newValue: album });
  return album;
}

export async function softDeleteAlbum(id: string) {
  const session = await requirePermission("gallery", "delete");
  const album = await prisma.galleryAlbum.update({ where: { id }, data: { deletedAt: new Date() } });
  await logAudit({ action: "gallery_album.delete", entity: "GalleryAlbum", entityId: id, meta: { by: session.user.id } });
  return album;
}

export async function restoreAlbum(id: string) {
  await requirePermission("gallery", "edit");
  const album = await prisma.galleryAlbum.update({ where: { id }, data: { deletedAt: null } });
  await logAudit({ action: "gallery_album.restore", entity: "GalleryAlbum", entityId: id });
  return album;
}

// ————— Items within an album —————

export async function listAlbumItems(albumId: string): Promise<GalleryItemRow[]> {
  await requirePermission("gallery", "view");
  return prisma.galleryItem.findMany({
    where: { albumId, deletedAt: null },
    orderBy: { sortOrder: "asc" },
  });
}

export async function addAlbumItems(albumId: string, urls: string[]) {
  const session = await requirePermission("gallery", "create");
  const maxOrder = await prisma.galleryItem.aggregate({ where: { albumId }, _max: { sortOrder: true } });
  let order = (maxOrder._max.sortOrder ?? 0) + 1;

  const created = await prisma.$transaction(
    urls.map((url) =>
      prisma.galleryItem.create({
        data: { albumId, url, sortOrder: order++, createdById: session.user.id },
      })
    )
  );
  await logAudit({ action: "gallery_item.create", entity: "GalleryAlbum", entityId: albumId, meta: { count: created.length } });
  return created;
}

export async function updateAlbumItem(id: string, data: { alt?: string; tags?: string[] }) {
  await requirePermission("gallery", "edit");
  const item = await prisma.galleryItem.update({
    where: { id },
    data: { alt: data.alt, tags: data.tags },
  });
  return item;
}

export async function deleteAlbumItem(id: string) {
  const session = await requirePermission("gallery", "delete");
  await prisma.galleryItem.update({ where: { id }, data: { deletedAt: new Date() } });
  await logAudit({ action: "gallery_item.delete", entity: "GalleryItem", entityId: id, meta: { by: session.user.id } });
}

export async function reorderAlbumItems(orderedIds: string[]) {
  await requirePermission("gallery", "edit");
  await prisma.$transaction(
    orderedIds.map((id, index) => prisma.galleryItem.update({ where: { id }, data: { sortOrder: index } }))
  );
}
