import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const leadSchema = z.object({
  type: z.enum(["CONTACT", "QUOTE", "VISIT", "CONCIERGE"]).default("CONTACT"),
  name: z.string().min(2, "Name is required").max(100),
  phone: z
    .string()
    .min(10, "Enter a valid phone number")
    .max(15)
    .regex(/^[+\d\s-]+$/, "Enter a valid phone number"),
  email: z.string().email().optional().or(z.literal("")),
  city: z.string().max(100).optional(),
  message: z.string().max(2000).optional(),
  interest: z.string().max(100).optional(),
  budget: z.string().max(50).optional(),
  visitDate: z.string().datetime().optional(),
  utmSource: z.string().max(100).optional(),
  utmMedium: z.string().max(100).optional(),
  utmCampaign: z.string().max(100).optional(),
});

// Naive in-memory rate limit — replace with Upstash/redis in production
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
  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { visitDate, email, ...rest } = parsed.data;

  const lead = await prisma.lead.create({
    data: {
      ...rest,
      email: email || null,
      visitDate: visitDate ? new Date(visitDate) : null,
      source: "website",
    },
  });

  return NextResponse.json({ ok: true, id: lead.id }, { status: 201 });
}
