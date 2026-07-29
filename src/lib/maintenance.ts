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

const DEFAULT_STATE: MaintenanceState = {
  enabled: false,
  message: "We're upgrading the showroom experience. Back shortly.",
  countdownUntil: "",
};

/**
 * This is read on every public request (the site layout gates on it), so an
 * unreachable database must not take the whole site down with it. Failing
 * closed would show a maintenance page during a transient blip — far worse
 * than briefly serving the site while maintenance mode is on — so a read
 * failure resolves to "not in maintenance".
 */
export async function getMaintenanceState(): Promise<MaintenanceState> {
  try {
    const rows = await prisma.setting.findMany({
      where: { key: { in: ["maintenance.enabled", "maintenance.message", "maintenance.countdownUntil", "maintenance.whitelist"] } },
    });
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    return {
      enabled: (map["maintenance.enabled"] as boolean) ?? false,
      message: (map["maintenance.message"] as string) ?? DEFAULT_STATE.message,
      countdownUntil: (map["maintenance.countdownUntil"] as string) ?? "",
    };
  } catch {
    return DEFAULT_STATE;
  }
}

export async function getMaintenanceWhitelist(): Promise<string[]> {
  try {
    const row = await prisma.setting.findUnique({ where: { key: "maintenance.whitelist" } });
    return (row?.value as string[]) ?? [];
  } catch {
    return [];
  }
}

export async function verifyMaintenancePassword(password: string): Promise<boolean> {
  const row = await prisma.setting.findUnique({ where: { key: "maintenance.passwordHash" } });
  if (!row) return false;
  const bcrypt = await import("bcryptjs");
  return bcrypt.compare(password, row.value as string);
}
