"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import type { ListParams, ListResult } from "@/hooks/useAdminList";
import type { AuditLog, Prisma } from "@prisma/client";

export type AuditLogRow = AuditLog & { user: { name: string; email: string } | null };

export async function listAuditLogs(
  params: ListParams & { action?: string; entity?: string }
): Promise<ListResult<AuditLogRow>> {
  await requirePermission("logs", "view");

  const where: Prisma.AuditLogWhereInput = {
    ...(params.action ? { action: { contains: params.action, mode: "insensitive" } } : {}),
    ...(params.entity ? { entity: params.entity } : {}),
    ...(params.search
      ? {
          OR: [
            { action: { contains: params.search, mode: "insensitive" } },
            { entity: { contains: params.search, mode: "insensitive" } },
            { entityId: { contains: params.search, mode: "insensitive" } },
            { ipAddress: { contains: params.search, mode: "insensitive" } },
            { user: { name: { contains: params.search, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: params.sortDir },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { rows, total };
}

export async function listDistinctEntities(): Promise<string[]> {
  await requirePermission("logs", "view");
  const rows = await prisma.auditLog.findMany({
    distinct: ["entity"],
    select: { entity: true },
    where: { entity: { not: null } },
  });
  return rows.map((r) => r.entity!).filter(Boolean).sort();
}

export async function exportAuditLogsCsv(): Promise<string> {
  await requirePermission("logs", "view");
  const logs = await prisma.auditLog.findMany({
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: 5000,
  });

  const header = ["Timestamp", "Action", "Entity", "Entity ID", "User", "Role", "IP Address", "User Agent"];
  const rows = logs.map((l) =>
    [
      l.createdAt.toISOString(),
      l.action,
      l.entity ?? "",
      l.entityId ?? "",
      l.user?.name ?? "System",
      l.roleAtTime ?? "",
      l.ipAddress ?? "",
      `"${(l.userAgent ?? "").replace(/"/g, '""')}"`,
    ].join(",")
  );

  return [header.join(","), ...rows].join("\n");
}
