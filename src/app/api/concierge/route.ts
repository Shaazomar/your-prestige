import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { business } from "@/lib/site-config";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

const schema = z.object({
  message: z.string().min(1).max(1000),
  sessionId: z.string().min(8).max(100),
});

/**
 * Lightweight intent engine for the concierge.
 * Swap this handler for a Claude API call (claude-sonnet-5) when ready —
 * the client contract ({message, sessionId} → {reply}) stays identical.
 */
const intents: { match: RegExp; reply: string }[] = [
  {
    match: /(tile|marble|porcelain|floor|wall|vitrified)/i,
    reply:
      "Our tile gallery spans 600+ designs — Italian marble slabs, large-format porcelain up to 1200×2400mm, and artisan ceramics from Kajaria, Simpolo, RAK and more. Would you like to browse the collection online, or shall I arrange a private showroom walkthrough?",
  },
  {
    match: /(bathroom|sanitary|faucet|shower|tub|basin|wc|toilet)/i,
    reply:
      "Beautiful choice — our bathroom sanctuaries feature Kohler, Grohe, Jaquar, Duravit and Hansgrohe, displayed as full-scale live suites in the showroom. Tell me your project stage (planning / renovation / finishing) and I'll suggest the right starting point.",
  },
  {
    match: /(brand|kajaria|kohler|grohe|jaquar|duravit|hansgrohe)/i,
    reply:
      "We're authorised partners for 40+ premium houses including Kajaria, Kohler, Grohe, Jaquar, Duravit, Hansgrohe, RAK Ceramics and Queo — with exclusive collections for coastal Karnataka. Any particular brand you'd like to explore?",
  },
  {
    match: /(price|cost|budget|rate|quote|quotation)/i,
    reply:
      `Pricing depends on the collection and project scale — and we offer dedicated trade pricing for architects and builders. The fastest route is a tailored quote: share your name and phone number here, or use the Request a Quote page, and our team will respond within a few working hours.`,
  },
  {
    match: /(visit|appointment|book|showroom|timing|hours|open)/i,
    reply:
      `We'd love to host you. The showroom is open Mon–Sat ${business.hours.weekdays} and Sun ${business.hours.sunday} at ${business.address.street}, ${business.address.city}. You can book a private consultation on the Book a Visit page — or share your name and number and I'll have our team call you.`,
  },
  {
    match: /(contact|phone|call|whatsapp|email)/i,
    reply:
      `You can reach us at ${business.phone}, on WhatsApp via the green button below, or ${business.email}. Prefer a callback? Share your name and number and we'll ring you shortly.`,
  },
  {
    match: /(architect|builder|trade|bulk|project)/i,
    reply:
      "We run a dedicated trade programme — priority sampling, dedicated account managers and project-scale pricing for architects and builders. Fifteen years, 2,400+ projects delivered across Dakshina Kannada. Shall I connect you with our projects team?",
  },
];

interface StoredMessage {
  role: "user" | "assistant";
  content: string;
  at: string;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid message" }, { status: 400 });
  }

  const { message, sessionId } = parsed.data;

  const phoneMatch = message.match(/(\+?\d[\d\s-]{8,14}\d)/);
  const leadExtracted = !!phoneMatch;

  const reply = leadExtracted
    ? "Perfect — I've noted your number and our design team will reach out shortly. If you'd like to fast-track things, you can also pick a slot on the Book a Visit page. It's been a pleasure!"
    : intents.find((i) => i.match.test(message))?.reply ??
      "I can help with collections, brands, pricing guidance and showroom visits. Could you tell me a little more about your project — is it a new home, a renovation, or a commercial space?";

  const userMsg: StoredMessage = { role: "user", content: message, at: new Date().toISOString() };
  const assistantMsg: StoredMessage = { role: "assistant", content: reply, at: new Date().toISOString() };

  const existing = await prisma.conversation.findFirst({ where: { sessionId } });
  if (existing) {
    const messages = (existing.messages as unknown as StoredMessage[]) ?? [];
    await prisma.conversation.update({
      where: { id: existing.id },
      data: {
        messages: [...messages, userMsg, assistantMsg] as unknown as Prisma.InputJsonValue,
        leadExtracted: existing.leadExtracted || leadExtracted,
      },
    });
  } else {
    await prisma.conversation.create({
      data: {
        sessionId,
        messages: [userMsg, assistantMsg] as unknown as Prisma.InputJsonValue,
        leadExtracted,
      },
    });
  }

  return NextResponse.json({ reply, leadCaptured: leadExtracted });
}
