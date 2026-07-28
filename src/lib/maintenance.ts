import { createHmac, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";

export const MAINTENANCE_COOKIE = "prestige_maintenance_bypass";

function bypassToken(): string {
  return createHmac("sha256", process.env.AUTH_SECRET ?? "dev-secret")
    .update("maintenance-bypass")
    .digest("hex");
}

export function isValidBypassToken(value: string | undefined): boolean {
  if (!value) return false;
  const expected = bypassToken();
  const a = Buffer.from(value);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function issueBypassToken(): string {
  return bypassToken();
}

export interface MaintenanceState {
  enabled: boolean;
  message: string;
  countdownUntil: string;
}

export async function getMaintenanceState(): Promise<MaintenanceState> {
  const rows = await prisma.setting.findMany({
    where: { key: { in: ["maintenance.enabled", "maintenance.message", "maintenance.countdownUntil", "maintenance.whitelist"] } },
  });
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    enabled: (map["maintenance.enabled"] as boolean) ?? false,
    message: (map["maintenance.message"] as string) ?? "We're upgrading the showroom experience. Back shortly.",
    countdownUntil: (map["maintenance.countdownUntil"] as string) ?? "",
  };
}

export async function getMaintenanceWhitelist(): Promise<string[]> {
  const row = await prisma.setting.findUnique({ where: { key: "maintenance.whitelist" } });
  return (row?.value as string[]) ?? [];
}

export async function verifyMaintenancePassword(password: string): Promise<boolean> {
  const row = await prisma.setting.findUnique({ where: { key: "maintenance.passwordHash" } });
  if (!row) return false;
  const bcrypt = await import("bcryptjs");
  return bcrypt.compare(password, row.value as string);
}
