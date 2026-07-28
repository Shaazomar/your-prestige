import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";

const patchSchema = z.object({
  status: z.enum(["NEW", "CONTACTED", "QUALIFIED", "VISITED", "QUOTED", "WON", "LOST"]),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission("leads", "edit");
  } catch (err) {
    const message = err instanceof Error ? err.message : "Forbidden";
    return NextResponse.json(
      { error: message },
      { status: message === "UNAUTHENTICATED" ? 401 : 403 }
    );
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  try {
    const before = await prisma.lead.findUniqueOrThrow({ where: { id } });
    const lead = await prisma.lead.update({
      where: { id },
      data: { status: parsed.data.status },
    });
    await logAudit({
      action: "lead.status_change",
      entity: "Lead",
      entityId: id,
      oldValue: { status: before.status },
      newValue: { status: lead.status },
    });
    return NextResponse.json({ ok: true, lead });
  } catch {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }
}
