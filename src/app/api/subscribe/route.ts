import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address").max(200),
});

// Naive in-memory rate limit, matching /api/leads. Fine for a single
// instance; swap for Upstash/Redis when this runs on more than one.
const hits = new Map<string, { count: number; reset: number }>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || now > entry.reset) {
    hits.set(ip, { count: 1, reset: now + 60_000 });
    return false;
  }
  entry.count += 1;
  return entry.count > 5;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  if (rateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Enter a valid email address" },
      { status: 400 }
    );
  }

  try {
    await prisma.subscriber.create({
      data: { email: parsed.data.email, source: "footer" },
    });
  } catch (err) {
    // Already subscribed — report success rather than disclosing that the
    // address is on the list, and so a double submit isn't a dead end.
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return NextResponse.json({ ok: true }, { status: 200 });
    }
    return NextResponse.json(
      { error: "Could not subscribe right now. Please try again later." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
