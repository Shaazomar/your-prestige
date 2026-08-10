import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { eventType, productId, productSku, productName, collectionName, quantity, unit, sourcePage, device } = body;

    if (!eventType) {
      return NextResponse.json({ error: "Missing eventType" }, { status: 400 });
    }

    const event = await prisma.whatsAppAnalytics.create({
      data: {
        eventType,
        productId: productId || null,
        productSku: productSku || null,
        productName: productName || null,
        collectionName: collectionName || null,
        quantity: quantity ? String(quantity) : null,
        unit: unit || null,
        sourcePage: sourcePage || null,
        device: device || null,
      },
    });

    return NextResponse.json({ success: true, eventId: event.id });
  } catch (error) {
    console.error("WhatsApp Analytics API Error:", error);
    return NextResponse.json({ error: "Failed to record event" }, { status: 500 });
  }
}
