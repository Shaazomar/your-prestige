"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import type { ListParams, ListResult } from "@/hooks/useAdminList";
import { seoSchema, type SeoInput, redirectSchema, type RedirectInput } from "./schema";
import type { Prisma, Seo, Redirect } from "@prisma/client";

// ————— Per-page SEO —————

export async function listSeoPages(params: ListParams): Promise<ListResult<Seo>> {
  await requirePermission("seo", "view");

  const where: Prisma.SeoWhereInput = params.search ? { path: { contains: params.search, mode: "insensitive" } } : {};

  const [rows, total] = await Promise.all([
    prisma.seo.findMany({ where, orderBy: { [params.sortBy === "path" ? "path" : "updatedAt"]: params.sortDir }, skip: (params.page - 1) * params.pageSize, take: params.pageSize }),
    prisma.seo.count({ where }),
  ]);
  return { rows, total };
}

function toData(data: SeoInput) {
  return {
    ...data,
    title: data.title || null,
    description: data.description || null,
    keywords: data.keywords || null,
    canonical: data.canonical || null,
    ogImage: data.ogImage || null,
    jsonLd: data.jsonLd || null,
  };
}

export async function createSeoPage(input: SeoInput) {
  await requirePermission("seo", "create");
  const data = seoSchema.parse(input);

  const existing = await prisma.seo.findUnique({ where: { path: data.path } });
  if (existing) throw new Error("An SEO entry for this path already exists.");

  const seo = await prisma.seo.create({ data: toData(data) });
  await logAudit({ action: "seo.create", entity: "Seo", entityId: seo.id, newValue: seo });
  return seo;
}

export async function updateSeoPage(id: string, input: SeoInput) {
  await requirePermission("seo", "edit");
  const data = seoSchema.parse(input);
  const before = await prisma.seo.findUniqueOrThrow({ where: { id } });
  const seo = await prisma.seo.update({ where: { id }, data: toData(data) });
  await logAudit({ action: "seo.update", entity: "Seo", entityId: id, oldValue: before, newValue: seo });
  return seo;
}

export async function deleteSeoPage(id: string) {
  const session = await requirePermission("seo", "delete");
  await prisma.seo.delete({ where: { id } });
  await logAudit({ action: "seo.delete", entity: "Seo", entityId: id, meta: { by: session.user.id } });
}

// ————— Redirects —————

export async function listRedirects(params: ListParams): Promise<ListResult<Redirect>> {
  await requirePermission("seo", "view");

  const where: Prisma.RedirectWhereInput = params.search ? { fromPath: { contains: params.search, mode: "insensitive" } } : {};

  const [rows, total] = await Promise.all([
    prisma.redirect.findMany({ where, orderBy: { fromPath: params.sortDir }, skip: (params.page - 1) * params.pageSize, take: params.pageSize }),
    prisma.redirect.count({ where }),
  ]);
  return { rows, total };
}

export async function createRedirect(input: RedirectInput) {
  await requirePermission("seo", "create");
  const data = redirectSchema.parse(input);

  const existing = await prisma.redirect.findUnique({ where: { fromPath: data.fromPath } });
  if (existing) throw new Error("A redirect from this path already exists.");

  const redirect = await prisma.redirect.create({ data });
  await logAudit({ action: "redirect.create", entity: "Redirect", entityId: redirect.id, newValue: redirect });
  return redirect;
}

export async function updateRedirect(id: string, input: RedirectInput) {
  await requirePermission("seo", "edit");
  const data = redirectSchema.parse(input);
  const before = await prisma.redirect.findUniqueOrThrow({ where: { id } });
  const redirect = await prisma.redirect.update({ where: { id }, data });
  await logAudit({ action: "redirect.update", entity: "Redirect", entityId: id, oldValue: before, newValue: redirect });
  return redirect;
}

export async function deleteRedirect(id: string) {
  const session = await requirePermission("seo", "delete");
  await prisma.redirect.delete({ where: { id } });
  await logAudit({ action: "redirect.delete", entity: "Redirect", entityId: id, meta: { by: session.user.id } });
}
