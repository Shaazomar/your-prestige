"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import type { ListParams, ListResult } from "@/hooks/useAdminList";
import { faqSchema, type FaqInput } from "./schema";
import type { Prisma, Faq } from "@prisma/client";

export async function listFaqs(params: ListParams): Promise<ListResult<Faq>> {
  await requirePermission("faqs", "view");

  const where: Prisma.FaqWhereInput = {
    deletedAt: params.trash ? { not: null } : null,
    ...(params.search ? { question: { contains: params.search, mode: "insensitive" } } : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.faq.findMany({ where, orderBy: { [params.sortBy]: params.sortDir }, skip: (params.page - 1) * params.pageSize, take: params.pageSize }),
    prisma.faq.count({ where }),
  ]);
  return { rows, total };
}

export async function createFaq(input: FaqInput) {
  const session = await requirePermission("faqs", "create");
  const data = faqSchema.parse(input);
  const faq = await prisma.faq.create({ data: { ...data, category: data.category || null, createdById: session.user.id } });
  await logAudit({ action: "faq.create", entity: "Faq", entityId: faq.id, newValue: faq });
  return faq;
}

export async function updateFaq(id: string, input: FaqInput) {
  await requirePermission("faqs", "edit");
  const data = faqSchema.parse(input);
  const before = await prisma.faq.findUniqueOrThrow({ where: { id } });
  const faq = await prisma.faq.update({ where: { id }, data: { ...data, category: data.category || null } });
  await logAudit({ action: "faq.update", entity: "Faq", entityId: id, oldValue: before, newValue: faq });
  return faq;
}

export async function softDeleteFaq(id: string) {
  const session = await requirePermission("faqs", "delete");
  const faq = await prisma.faq.update({ where: { id }, data: { deletedAt: new Date() } });
  await logAudit({ action: "faq.delete", entity: "Faq", entityId: id, meta: { by: session.user.id } });
  return faq;
}

export async function restoreFaq(id: string) {
  await requirePermission("faqs", "edit");
  const faq = await prisma.faq.update({ where: { id }, data: { deletedAt: null } });
  await logAudit({ action: "faq.restore", entity: "Faq", entityId: id });
  return faq;
}
