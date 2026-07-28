import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getConciergeKnowledge, type ConciergeKnowledge } from "@/lib/concierge-knowledge";
import type { Prisma } from "@prisma/client";

const schema = z.object({
  message: z.string().min(1).max(1000),
  sessionId: z.string().min(8).max(100),
});

interface StoredMessage {
  role: "user" | "assistant";
  content: string;
  at: string;
}

/**
 * Concierge reply engine, grounded in live CMS content.
 *
 * This is a deterministic retrieval-and-template engine, not an LLM: it
 * matches intent, then answers using real products / brands / showrooms /
 * FAQs / business hours pulled from the database via
 * `getConciergeKnowledge()`. That means it never invents a product or a
 * showroom that doesn't exist.
 *
 * To upgrade to a real LLM, replace `buildReply()` with a Claude call that
 * receives the same `knowledge` object as grounding context — the request
 * contract ({message, sessionId} → {reply}) and persistence below stay as-is.
 */
function buildReply(message: string, k: ConciergeKnowledge): string {
  const q = message.toLowerCase();
  const b = k.business;

  // — Nearest / location / directions —
  if (/(near|nearest|closest|location|where|address|branch|showroom|visit|direction)/i.test(q)) {
    // Try to match a specific locality or city the visitor named.
    const named = k.showrooms.find(
      (s) =>
        (s.locality && q.includes(s.locality.toLowerCase())) ||
        q.includes(s.city.toLowerCase())
    );
    if (named) {
      return `Our ${named.locality ?? named.city} showroom — ${named.name} — is at ${named.address}. ${named.hoursWeekdays}; ${named.hoursSunday}. Call ${named.phone}, or open /showrooms/${named.slug} for directions, the gallery and a booking link.`;
    }
    const list = k.showrooms
      .map((s) => `${s.locality ?? s.city} (${s.city})`)
      .join(", ");
    return `We have ${k.showrooms.length} showrooms: ${list}. ${b.hoursWeekdays}. Tell me which city you're in and I'll point you to the closest one — or open the Showrooms page and tap "Find nearest to me" for exact distances.`;
  }

  // — Specific product lookup —
  const productHit = k.products.find(
    (p) =>
      q.includes(p.name.toLowerCase()) ||
      (p.collection && q.includes(p.collection.toLowerCase()))
  );
  if (productHit) {
    const bits = [
      productHit.finish,
      productHit.sizes.length ? `available in ${productHit.sizes.join(", ")}` : null,
      productHit.brand ? `by ${productHit.brand}` : null,
    ].filter(Boolean);
    return `${productHit.name}${productHit.collection ? ` (${productHit.collection})` : ""} — ${bits.join(", ")}. ${productHit.applications.length ? `Suited to ${productHit.applications.join(", ")}. ` : ""}Would you like me to arrange a showroom viewing, or shall I put you in touch for a quote?`;
  }

  // — Tiles —
  if (/(tile|marble|porcelain|floor|wall|vitrified|slab|granite)/i.test(q)) {
    const tiles = k.products.filter((p) => p.category === "tiles");
    const names = tiles.slice(0, 4).map((p) => p.name).join(", ");
    return `Our tile range${tiles.length ? ` includes ${names}` : ""} — Italian marble looks, large-format porcelain and artisan ceramics from ${k.brands.slice(0, 5).join(", ")}${k.brands.length > 5 ? " and more" : ""}. Would you like to browse the catalogue, or see full slabs at a showroom?`;
  }

  // — Sanitary / bathroom —
  if (/(bathroom|sanitary|faucet|shower|tub|basin|wc|toilet|jacuzzi|tap|fitting)/i.test(q)) {
    const sanitary = k.products.filter((p) => p.category === "sanitary");
    const names = sanitary.slice(0, 4).map((p) => p.name).join(", ");
    return `Our bathroom collections${names ? ` include ${names}` : ""} — displayed as full live suites you can actually test. ${k.showrooms[0] ? `The ${k.showrooms[0].locality ?? k.showrooms[0].city} showroom has the widest display.` : ""} Tell me your project stage and I'll suggest where to start.`;
  }

  // — Brands —
  if (/(brand|jaquar|kohler|grohe|essco|hindware|cera|kajaria|somany|duravit|rak)/i.test(q)) {
    const askedBrand = k.brands.find((br) => q.includes(br.toLowerCase()));
    if (askedBrand) {
      const where = k.showrooms.filter((s) => s.brands.some((x) => x.toLowerCase() === askedBrand.toLowerCase()));
      return `Yes — we stock ${askedBrand}.${where.length ? ` Available at our ${where.map((s) => s.locality ?? s.city).join(", ")} showroom${where.length > 1 ? "s" : ""}.` : ""} Would you like to see the range in person?`;
    }
    return `We're authorised partners for ${k.brands.slice(0, 8).join(", ")}${k.brands.length > 8 ? ` and ${k.brands.length - 8} more` : ""}. Any particular brand you're looking for?`;
  }

  // — Pricing / quotation —
  if (/(price|cost|budget|rate|quote|quotation|estimate|per sq)/i.test(q)) {
    return `Pricing depends on the collection and project scale, and we offer dedicated trade pricing for architects and builders. The fastest route is a tailored quote — use the Request a Quote page, or share your name and number here and our team will respond within a few working hours.`;
  }

  // — Hours —
  if (/(time|hour|open|close|sunday|holiday|when)/i.test(q)) {
    const sundayOpen = k.showrooms.filter((s) => !/closed/i.test(s.hoursSunday));
    return `${b.hoursWeekdays}. ${sundayOpen.length ? `On Sundays, ${sundayOpen.map((s) => `${s.locality ?? s.city} is open ${s.hoursSunday.replace(/^Sunday:\s*/i, "")}`).join(" and ")} — other branches are closed.` : b.hoursSunday}`;
  }

  // — Contact —
  if (/(contact|phone|call|whatsapp|email|reach)/i.test(q)) {
    return `You can reach us on ${b.phone}${b.email ? `, by email at ${b.email}` : ""}, or via WhatsApp using the green button. Prefer a callback? Share your name and number and we'll ring you shortly.`;
  }

  // — Trade / architect / builder —
  if (/(architect|builder|trade|bulk|project|contractor|interior designer)/i.test(q)) {
    return `We run a dedicated trade programme — priority sampling, a named account manager and project-scale pricing across all ${k.showrooms.length} showrooms. Shall I connect you with our projects team?`;
  }

  // — FAQ fallback: keyword overlap against published FAQs —
  const faq = bestFaqMatch(q, k.faqs);
  if (faq) return faq.answer;

  return `I can help with collections, brands, pricing guidance, showroom locations and booking a visit. Could you tell me a little more — is this for a new home, a renovation, or a commercial project?`;
}

/** Lightweight keyword-overlap FAQ retrieval. */
function bestFaqMatch(q: string, faqs: { question: string; answer: string }[]) {
  const stop = new Set(["the", "a", "an", "is", "are", "do", "you", "i", "we", "of", "in", "to", "for", "and", "my", "can", "what", "how"]);
  const terms = q.split(/\W+/).filter((w) => w.length > 3 && !stop.has(w));
  if (terms.length === 0) return null;

  let best: { faq: (typeof faqs)[number]; score: number } | null = null;
  for (const faq of faqs) {
    const hay = `${faq.question} ${faq.answer}`.toLowerCase();
    const score = terms.reduce((n, t) => (hay.includes(t) ? n + 1 : n), 0);
    if (score >= 2 && (!best || score > best.score)) best = { faq, score };
  }
  return best?.faq ?? null;
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

  let reply: string;
  if (leadExtracted) {
    reply =
      "Perfect — I've noted your number and our design team will reach out shortly. If you'd like to fast-track things, you can also pick a slot on the Book a Visit page. It's been a pleasure!";
  } else {
    const knowledge = await getConciergeKnowledge();
    reply = buildReply(message, knowledge);
  }

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
