import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { upsertCalendarEvent } from "@/lib/google-calendar";

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
  preferredTime: z.string().max(30).optional(),
  showroomSlug: z.string().max(150).optional(),
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

  const { visitDate, email, preferredTime, showroomSlug, type, ...rest } = parsed.data;

  const lead = await prisma.lead.create({
    data: {
      ...rest,
      type,
      email: email || null,
      visitDate: visitDate ? new Date(visitDate) : null,
      source: "website",
    },
  });

  // A visit enquiry with a date becomes a real Booking so it lands in the
  // admin Bookings calendar, not just the leads pipeline.
  if (type === "VISIT" && visitDate) {
    const showroom = showroomSlug
      ? await prisma.showroom.findFirst({
          where: { slug: showroomSlug, deletedAt: null },
          select: { id: true, name: true, locality: true, city: true },
        })
      : null;

    const booking = await prisma.booking.create({
      data: {
        name: lead.name,
        phone: lead.phone,
        email: lead.email,
        requestedDate: new Date(visitDate),
        preferredTime: preferredTime || null,
        notes: lead.message,
        interestedIn: lead.interest ? [lead.interest] : undefined,
        leadId: lead.id,
        showroomId: showroom?.id ?? null,
        status: "PENDING",
      },
    });

    // Both integrations are env-gated no-ops until credentials are configured.
    const eventId = await upsertCalendarEvent(booking).catch(() => null);
    if (eventId) {
      await prisma.booking.update({ where: { id: booking.id }, data: { googleEventId: eventId } });
    }

    if (lead.email) {
      const where = showroom
        ? `${showroom.name}, ${showroom.locality ?? showroom.city}`
        : "our showroom";
      await sendEmail({
        to: lead.email,
        subject: "Your Prestige showroom visit request",
        html: `<p>Hi ${lead.name},</p>
<p>Thank you — we've received your request to visit <strong>${where}</strong> on
<strong>${new Date(visitDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</strong>${
          preferredTime ? ` around <strong>${preferredTime}</strong>` : ""
        }.</p>
<p>Our team will confirm your slot by phone or WhatsApp shortly.</p>
<p>— Prestige Tiles &amp; Sanitary</p>`,
      }).catch(() => null);
    }

    return NextResponse.json(
      { ok: true, id: lead.id, bookingId: booking.id },
      { status: 201 }
    );
  }

  return NextResponse.json({ ok: true, id: lead.id }, { status: 201 });
}
