"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { findMediaUsage, findUnusedMedia } from "@/lib/media/organise";
import type { ListParams, ListResult } from "@/hooks/useAdminList";
import type { Prisma, Media, MediaFolder } from "@prisma/client";

export type MediaRow = Media & { folder: { name: string } | null };

export async function listMedia(params: ListParams & { folderId?: string | null }): Promise<ListResult<MediaRow>> {
  await requirePermission("media", "view");

  const where: Prisma.MediaWhereInput = {
    deletedAt: params.trash ? { not: null } : null,
    ...(params.folderId !== undefined ? { folderId: params.folderId } : {}),
    ...(params.search
      ? { OR: [{ filename: { contains: params.search, mode: "insensitive" } }, { altText: { contains: params.search, mode: "insensitive" } }] }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.media.findMany({
      where,
      include: { folder: { select: { name: true } } },
      orderBy: { [params.sortBy === "filename" ? "filename" : "createdAt"]: params.sortDir },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
    }),
    prisma.media.count({ where }),
  ]);

  return { rows, total };
}

export async function listFolders(): Promise<MediaFolder[]> {
  await requirePermission("media", "view");
  return prisma.mediaFolder.findMany({ orderBy: { name: "asc" } });
}

export async function createFolder(name: string, parentId?: string | null) {
  await requirePermission("media", "create");
  const folder = await prisma.mediaFolder.create({ data: { name, parentId: parentId || null } });
  await logAudit({ action: "media_folder.create", entity: "MediaFolder", entityId: folder.id, newValue: folder });
  return folder;
}

export async function updateMediaMeta(id: string, data: { altText?: string; tags?: string[]; folderId?: string | null }) {
  await requirePermission("media", "edit");
  const media = await prisma.media.update({ where: { id }, data });
  return media;
}

/** Products referencing a URL flag it as "in use" so admins don't delete active media by accident. */
/**
 * Where a file is used, if anywhere.
 *
 * This previously checked only a few scalar columns, which meant every gallery
 * image — those all live in `Json` arrays — reported as unused and looked safe
 * to delete. `findMediaUsage` covers the array columns too and names what
 * refers to the file, so the warning can say what would break.
 */
export async function checkMediaUsage(url: string): Promise<string[]> {
  await requirePermission("media", "view");
  return findMediaUsage(url);
}

/** Library files nothing references — the cleanup report. */
export async function listUnusedMedia() {
  await requirePermission("media", "view");
  return findUnusedMedia();
}

export async function softDeleteMedia(id: string) {
  const session = await requirePermission("media", "delete");
  const media = await prisma.media.update({ where: { id }, data: { deletedAt: new Date() } });
  await logAudit({ action: "media.delete", entity: "Media", entityId: id, meta: { by: session.user.id } });
  return media;
}

export async function restoreMedia(id: string) {
  await requirePermission("media", "edit");
  const media = await prisma.media.update({ where: { id }, data: { deletedAt: null } });
  await logAudit({ action: "media.restore", entity: "Media", entityId: id });
  return media;
}
