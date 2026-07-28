"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import type { ListParams, ListResult } from "@/hooks/useAdminList";
import { testimonialSchema, type TestimonialInput } from "./schema";
import type { Prisma, Testimonial } from "@prisma/client";

export async function listTestimonials(params: ListParams): Promise<ListResult<Testimonial>> {
  await requirePermission("testimonials", "view");

  const where: Prisma.TestimonialWhereInput = {
    deletedAt: params.trash ? { not: null } : null,
    ...(params.search
      ? { OR: [{ name: { contains: params.search, mode: "insensitive" } }, { quote: { contains: params.search, mode: "insensitive" } }] }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.testimonial.findMany({ where, orderBy: { [params.sortBy]: params.sortDir }, skip: (params.page - 1) * params.pageSize, take: params.pageSize }),
    prisma.testimonial.count({ where }),
  ]);
  return { rows, total };
}

function toData(data: TestimonialInput) {
  return {
    ...data,
    role: data.role || null,
    image: data.image || null,
    videoUrl: data.videoUrl || null,
    googleReviewUrl: data.googleReviewUrl || null,
  };
}

export async function createTestimonial(input: TestimonialInput) {
  const session = await requirePermission("testimonials", "create");
  const data = testimonialSchema.parse(input);
  const testimonial = await prisma.testimonial.create({ data: { ...toData(data), createdById: session.user.id } });
  await logAudit({ action: "testimonial.create", entity: "Testimonial", entityId: testimonial.id, newValue: testimonial });
  return testimonial;
}

export async function updateTestimonial(id: string, input: TestimonialInput) {
  await requirePermission("testimonials", "edit");
  const data = testimonialSchema.parse(input);
  const before = await prisma.testimonial.findUniqueOrThrow({ where: { id } });
  const testimonial = await prisma.testimonial.update({ where: { id }, data: toData(data) });
  await logAudit({ action: "testimonial.update", entity: "Testimonial", entityId: id, oldValue: before, newValue: testimonial });
  return testimonial;
}

export async function softDeleteTestimonial(id: string) {
  const session = await requirePermission("testimonials", "delete");
  const testimonial = await prisma.testimonial.update({ where: { id }, data: { deletedAt: new Date() } });
  await logAudit({ action: "testimonial.delete", entity: "Testimonial", entityId: id, meta: { by: session.user.id } });
  return testimonial;
}

export async function restoreTestimonial(id: string) {
  await requirePermission("testimonials", "edit");
  const testimonial = await prisma.testimonial.update({ where: { id }, data: { deletedAt: null } });
  await logAudit({ action: "testimonial.restore", entity: "Testimonial", entityId: id });
  return testimonial;
}
