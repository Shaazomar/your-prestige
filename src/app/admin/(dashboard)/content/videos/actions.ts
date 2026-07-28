"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import type { ListParams, ListResult } from "@/hooks/useAdminList";
import { videoSchema, type VideoInput } from "./schema";
import type { Prisma, Video } from "@prisma/client";

export async function listVideos(params: ListParams): Promise<ListResult<Video>> {
  await requirePermission("videos", "view");

  const where: Prisma.VideoWhereInput = {
    deletedAt: params.trash ? { not: null } : null,
    ...(params.search ? { title: { contains: params.search, mode: "insensitive" } } : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.video.findMany({ where, orderBy: { [params.sortBy]: params.sortDir }, skip: (params.page - 1) * params.pageSize, take: params.pageSize }),
    prisma.video.count({ where }),
  ]);
  return { rows, total };
}

export async function createVideo(input: VideoInput) {
  const session = await requirePermission("videos", "create");
  const data = videoSchema.parse(input);

  const existing = await prisma.video.findUnique({ where: { slug: data.slug } });
  if (existing) throw new Error("A video with this slug already exists.");

  const video = await prisma.video.create({
    data: { ...data, description: data.description || null, thumbnail: data.thumbnail || null, category: data.category || null, createdById: session.user.id },
  });
  await logAudit({ action: "video.create", entity: "Video", entityId: video.id, newValue: video });
  return video;
}

export async function updateVideo(id: string, input: VideoInput) {
  await requirePermission("videos", "edit");
  const data = videoSchema.parse(input);

  const before = await prisma.video.findUniqueOrThrow({ where: { id } });
  const duplicate = await prisma.video.findFirst({ where: { slug: data.slug, id: { not: id } } });
  if (duplicate) throw new Error("A video with this slug already exists.");

  const video = await prisma.video.update({
    where: { id },
    data: { ...data, description: data.description || null, thumbnail: data.thumbnail || null, category: data.category || null },
  });
  await logAudit({ action: "video.update", entity: "Video", entityId: id, oldValue: before, newValue: video });
  return video;
}

export async function softDeleteVideo(id: string) {
  const session = await requirePermission("videos", "delete");
  const video = await prisma.video.update({ where: { id }, data: { deletedAt: new Date() } });
  await logAudit({ action: "video.delete", entity: "Video", entityId: id, meta: { by: session.user.id } });
  return video;
}

export async function restoreVideo(id: string) {
  await requirePermission("videos", "edit");
  const video = await prisma.video.update({ where: { id }, data: { deletedAt: null } });
  await logAudit({ action: "video.restore", entity: "Video", entityId: id });
  return video;
}
