"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import type { ListParams, ListResult } from "@/hooks/useAdminList";
import { googlePostSchema, type GooglePostInput } from "./schema";
import type { GooglePost, Prisma } from "@prisma/client";

export type GooglePostRow = GooglePost;

/**
 * Google Business posts, mirrored into the CMS so they can also render on the
 * site. Entered by hand — the Business Profile API needs per-user OAuth and
 * verified location ownership, neither of which this deployment has.
 */
export async function listGooglePosts(params: ListParams): Promise<ListResult<GooglePostRow>> {
  await requirePermission("showrooms", "view");

  const where: Prisma.GooglePostWhereInput = {
    deletedAt: params.trash ? { not: null } : null,
    ...(params.search
      ? {
          OR: [
            { title: { contains: params.search, mode: "insensitive" } },
            { body: { contains: params.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.googlePost.findMany({
      where,
      orderBy: { [params.sortBy]: params.sortDir },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
    }),
    prisma.googlePost.count({ where }),
  ]);

  return { rows, total };
}

/** Empty date strings must become null, not Invalid Date. */
const toDate = (v?: string) => (v && v.trim() ? new Date(v) : null);

function toData(data: GooglePostInput) {
  return {
    type: data.type,
    title: data.title,
    body: data.body || null,
    image: data.image || null,
    ctaLabel: data.ctaLabel || null,
    ctaUrl: data.ctaUrl || null,
    startsAt: toDate(data.startsAt),
    endsAt: toDate(data.endsAt),
    sourceUrl: data.sourceUrl || null,
    showroomId: data.showroomId || null,
    published: data.published,
    sortOrder: data.sortOrder,
  };
}

export async function createGooglePost(input: GooglePostInput) {
  const session = await requirePermission("showrooms", "create");
  const data = googlePostSchema.parse(input);
  const created = await prisma.googlePost.create({
    data: { ...toData(data), createdById: session.user.id },
  });
  await logAudit({
    action: "google_post.create",
    entity: "GooglePost",
    entityId: created.id,
    newValue: { title: created.title, type: created.type },
  });
  revalidatePath("/showrooms");
  return created;
}

export async function updateGooglePost(id: string, input: GooglePostInput) {
  const session = await requirePermission("showrooms", "edit");
  const data = googlePostSchema.parse(input);
  const before = await prisma.googlePost.findUniqueOrThrow({ where: { id } });
  const after = await prisma.googlePost.update({
    where: { id },
    data: { ...toData(data), updatedById: session.user.id },
  });
  await logAudit({
    action: "google_post.update",
    entity: "GooglePost",
    entityId: id,
    oldValue: { title: before.title },
    newValue: { title: after.title },
  });
  revalidatePath("/showrooms");
  return after;
}

export async function softDeleteGooglePost(id: string) {
  const session = await requirePermission("showrooms", "delete");
  await prisma.googlePost.update({
    where: { id },
    data: { deletedAt: new Date(), deletedById: session.user.id },
  });
  await logAudit({ action: "google_post.delete", entity: "GooglePost", entityId: id });
  revalidatePath("/showrooms");
}

export async function restoreGooglePost(id: string) {
  await requirePermission("showrooms", "edit");
  await prisma.googlePost.update({ where: { id }, data: { deletedAt: null, deletedById: null } });
  await logAudit({ action: "google_post.restore", entity: "GooglePost", entityId: id });
  revalidatePath("/showrooms");
}

export async function getShowroomOptions() {
  await requirePermission("showrooms", "view");
  return prisma.showroom.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true },
    orderBy: { sortOrder: "asc" },
  });
}
