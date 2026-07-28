"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import type { Prisma } from "@prisma/client";

export interface MaintenanceSettings {
  enabled: boolean;
  message: string;
  countdownUntil: string; // ISO datetime or ""
  whitelist: string[]; // IP addresses
  hasPassword: boolean;
}

export async function getMaintenanceSettings(): Promise<MaintenanceSettings> {
  await requirePermission("maintenance", "view");
  const rows = await prisma.setting.findMany({
    where: { key: { in: ["maintenance.enabled", "maintenance.message", "maintenance.countdownUntil", "maintenance.whitelist", "maintenance.passwordHash"] } },
  });
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    enabled: (map["maintenance.enabled"] as boolean) ?? false,
    message: (map["maintenance.message"] as string) ?? "We're upgrading the showroom experience. Back shortly.",
    countdownUntil: (map["maintenance.countdownUntil"] as string) ?? "",
    whitelist: (map["maintenance.whitelist"] as string[]) ?? [],
    hasPassword: !!map["maintenance.passwordHash"],
  };
}

export async function saveMaintenanceSettings(data: {
  enabled: boolean;
  message: string;
  countdownUntil: string;
  whitelist: string[];
  password?: string;
}) {
  const session = await requirePermission("maintenance", "settings");

  const updates: [string, Prisma.InputJsonValue][] = [
    ["maintenance.enabled", data.enabled],
    ["maintenance.message", data.message],
    ["maintenance.countdownUntil", data.countdownUntil],
    ["maintenance.whitelist", data.whitelist],
  ];
  if (data.password) {
    updates.push(["maintenance.passwordHash", await bcrypt.hash(data.password, 12)]);
  }

  await prisma.$transaction(
    updates.map(([key, value]) =>
      prisma.setting.upsert({ where: { key }, create: { key, value }, update: { value } })
    )
  );

  await logAudit({ action: "maintenance.update", entity: "Setting", newValue: { enabled: data.enabled }, meta: { by: session.user.id } });
}
