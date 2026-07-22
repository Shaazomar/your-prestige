import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

// NOTE: wire NextAuth session + RBAC check here before production.

const patchSchema = z.object({
  status: z.enum(["NEW", "CONTACTED", "QUALIFIED", "VISITED", "QUOTED", "WON", "LOST"]),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  try {
    const lead = await prisma.lead.update({
      where: { id },
      data: { status: parsed.data.status },
    });
    await prisma.auditLog.create({
      data: {
        action: "lead.status_change",
        entity: "Lead",
        entityId: id,
        meta: JSON.stringify({ to: parsed.data.status }),
      },
    });
    return NextResponse.json({ ok: true, lead });
  } catch {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }
}
