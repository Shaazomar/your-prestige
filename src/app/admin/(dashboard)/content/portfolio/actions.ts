"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import type { ListParams, ListResult } from "@/hooks/useAdminList";
import { projectSchema, type ProjectInput } from "./schema";
import type { Prisma, Project } from "@prisma/client";

export type ProjectRow = Project;

export async function listProjects(params: ListParams): Promise<ListResult<ProjectRow>> {
  await requirePermission("portfolio", "view");

  const where: Prisma.ProjectWhereInput = {
    deletedAt: params.trash ? { not: null } : null,
    ...(params.search
      ? {
          OR: [
            { title: { contains: params.search, mode: "insensitive" } },
            { location: { contains: params.search, mode: "insensitive" } },
            { client: { contains: params.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.project.findMany({
      where,
      orderBy: { [params.sortBy]: params.sortDir },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
    }),
    prisma.project.count({ where }),
  ]);

  return { rows, total };
}

function toData(data: ProjectInput) {
  return {
    ...data,
    client: data.client || null,
    builder: data.builder || null,
    architect: data.architect || null,
    location: data.location || null,
    year: data.year || null,
    completionDate: data.completionDate ? new Date(data.completionDate) : null,
    description: data.description || null,
    video: data.video || null,
  };
}

export async function createProject(input: ProjectInput) {
  const session = await requirePermission("portfolio", "create");
  const data = projectSchema.parse(input);

  const existing = await prisma.project.findUnique({ where: { slug: data.slug } });
  if (existing) throw new Error("A project with this slug already exists.");

  const project = await prisma.project.create({
    data: { ...toData(data), createdById: session.user.id, updatedById: session.user.id },
  });

  await logAudit({ action: "project.create", entity: "Project", entityId: project.id, newValue: project });
  return project;
}

export async function updateProject(id: string, input: ProjectInput) {
  const session = await requirePermission("portfolio", "edit");
  const data = projectSchema.parse(input);

  const before = await prisma.project.findUniqueOrThrow({ where: { id } });
  const duplicate = await prisma.project.findFirst({ where: { slug: data.slug, id: { not: id } } });
  if (duplicate) throw new Error("A project with this slug already exists.");

  const project = await prisma.project.update({
    where: { id },
    data: { ...toData(data), updatedById: session.user.id },
  });

  await logAudit({ action: "project.update", entity: "Project", entityId: id, oldValue: before, newValue: project });
  return project;
}

export async function softDeleteProject(id: string) {
  const session = await requirePermission("portfolio", "delete");
  const project = await prisma.project.update({
    where: { id },
    data: { deletedAt: new Date(), deletedById: session.user.id },
  });
  await logAudit({ action: "project.delete", entity: "Project", entityId: id });
  return project;
}

export async function restoreProject(id: string) {
  await requirePermission("portfolio", "edit");
  const project = await prisma.project.update({ where: { id }, data: { deletedAt: null, deletedById: null } });
  await logAudit({ action: "project.restore", entity: "Project", entityId: id });
  return project;
}
