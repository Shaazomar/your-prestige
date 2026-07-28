"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import type { ListParams, ListResult } from "@/hooks/useAdminList";
import { postSchema, type PostInput } from "./schema";
import type { Prisma, Post } from "@prisma/client";

export type PostRow = Post & { status: "draft" | "scheduled" | "published" };

/**
 * Flips any post whose scheduledAt has arrived to published. There's no
 * background job runner in this deployment, so this runs opportunistically
 * whenever the admin list is loaded — sufficient for a low-traffic CMS,
 * but a real cron/queue is the production-grade version of this.
 */
async function promoteDuePosts() {
  await prisma.post.updateMany({
    where: { published: false, scheduledAt: { lte: new Date() }, deletedAt: null },
    data: { published: true, publishedAt: new Date() },
  });
}

function deriveStatus(post: Post): PostRow["status"] {
  if (post.published) return "published";
  if (post.scheduledAt) return "scheduled";
  return "draft";
}

export async function listPosts(params: ListParams): Promise<ListResult<PostRow>> {
  await requirePermission("blog", "view");
  await promoteDuePosts();

  const where: Prisma.PostWhereInput = {
    deletedAt: params.trash ? { not: null } : null,
    ...(params.search
      ? { OR: [{ title: { contains: params.search, mode: "insensitive" } }, { slug: { contains: params.search, mode: "insensitive" } }] }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.post.findMany({ where, orderBy: { [params.sortBy]: params.sortDir }, skip: (params.page - 1) * params.pageSize, take: params.pageSize }),
    prisma.post.count({ where }),
  ]);

  return { rows: rows.map((r) => ({ ...r, status: deriveStatus(r) })), total };
}

function statusToFields(status: PostInput["status"], scheduledAt: string | undefined, existing?: Post) {
  if (status === "published") {
    return { published: true, publishedAt: existing?.publishedAt ?? new Date(), scheduledAt: null };
  }
  if (status === "scheduled") {
    return { published: false, publishedAt: null, scheduledAt: scheduledAt ? new Date(scheduledAt) : null };
  }
  return { published: false, publishedAt: null, scheduledAt: null };
}

export async function createPost(input: PostInput) {
  const session = await requirePermission("blog", "create");
  const data = postSchema.parse(input);

  const existing = await prisma.post.findUnique({ where: { slug: data.slug } });
  if (existing) throw new Error("A post with this slug already exists.");

  const post = await prisma.post.create({
    data: {
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt || null,
      content: data.content,
      coverImage: data.coverImage || null,
      category: data.category || null,
      tags: data.tags,
      ...statusToFields(data.status, data.scheduledAt),
      authorId: session.user.id,
      createdById: session.user.id,
      updatedById: session.user.id,
    },
  });

  await logAudit({ action: "post.create", entity: "Post", entityId: post.id, newValue: post });
  return post;
}

export async function updatePost(id: string, input: PostInput) {
  const session = await requirePermission("blog", "edit");
  const data = postSchema.parse(input);

  const before = await prisma.post.findUniqueOrThrow({ where: { id } });
  const duplicate = await prisma.post.findFirst({ where: { slug: data.slug, id: { not: id } } });
  if (duplicate) throw new Error("A post with this slug already exists.");

  const post = await prisma.post.update({
    where: { id },
    data: {
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt || null,
      content: data.content,
      coverImage: data.coverImage || null,
      category: data.category || null,
      tags: data.tags,
      ...statusToFields(data.status, data.scheduledAt, before),
      updatedById: session.user.id,
    },
  });

  await logAudit({ action: "post.update", entity: "Post", entityId: id, oldValue: before, newValue: post });
  return post;
}

export async function softDeletePost(id: string) {
  const session = await requirePermission("blog", "delete");
  const post = await prisma.post.update({ where: { id }, data: { deletedAt: new Date(), deletedById: session.user.id } });
  await logAudit({ action: "post.delete", entity: "Post", entityId: id });
  return post;
}

export async function restorePost(id: string) {
  await requirePermission("blog", "edit");
  const post = await prisma.post.update({ where: { id }, data: { deletedAt: null, deletedById: null } });
  await logAudit({ action: "post.restore", entity: "Post", entityId: id });
  return post;
}
