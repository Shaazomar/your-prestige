import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import type { Prisma } from "@prisma/client";

interface LogAuditParams {
  action: string; // e.g. "product.create", "lead.status_change", "auth.login"
  entity?: string;
  entityId?: string;
  oldValue?: unknown;
  newValue?: unknown;
  meta?: unknown;
}

/** Normalizes an arbitrary value into something Prisma's Json column accepts. */
function toJson(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined || value === null) return undefined;
  return JSON.parse(JSON.stringify(value));
}

/**
 * Writes one row to AuditLog, capturing who/when/where alongside the change.
 * Call this from every mutating Server Action / Route Handler. Never throws
 * — a failed audit write must not roll back the primary operation.
 */
export async function logAudit(params: LogAuditParams) {
  try {
    const [session, h] = await Promise.all([auth(), headers()]);
    const forwardedFor = h.get("x-forwarded-for");
    const ip = forwardedFor?.split(",")[0]?.trim() || h.get("x-real-ip") || undefined;

    await prisma.auditLog.create({
      data: {
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        oldValue: toJson(params.oldValue),
        newValue: toJson(params.newValue),
        meta: toJson(params.meta),
        ipAddress: ip,
        userAgent: h.get("user-agent") || undefined,
        roleAtTime: session?.user?.role,
        userId: session?.user?.id,
      },
    });
  } catch (err) {
    console.error("logAudit failed:", err);
  }
}
