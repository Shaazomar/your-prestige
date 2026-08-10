import { cache } from "react";
import { prisma } from "@/lib/prisma";

export interface SingleProductEnquiryInput {
  productName: string;
  sku?: string;
  variant?: string;
  size?: string;
  finish?: string;
  quantity?: number | string;
  unit?: string;
  price?: number | string;
  productUrl?: string;
  customNotes?: string;
}

export interface EnquiryListItem {
  id: string;
  name: string;
  sku?: string;
  size?: string;
  finish?: string;
  quantity: number;
  unit: string; // Boxes | Pieces | Sq.ft | Sq.m
  price?: number;
  productUrl?: string;
}

/**
 * Single source of truth for the active WhatsApp Ordering Number.
 * Defaults to setting "whatsapp.number" -> "business.whatsapp" -> "+919876543210".
 */
export const getWhatsAppOrderingNumber = cache(async (): Promise<string> => {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: "whatsapp.number" },
    });
    if (setting && typeof setting.value === "string" && setting.value.trim().length > 0) {
      return setting.value.trim();
    }
    const bizSetting = await prisma.setting.findUnique({
      where: { key: "business.whatsapp" },
    });
    if (bizSetting && typeof bizSetting.value === "string" && bizSetting.value.trim().length > 0) {
      return bizSetting.value.trim();
    }
  } catch {
    // Database fallback
  }
  return "+919876543210";
});

/**
 * Format a single-product order/enquiry message for WhatsApp.
 */
export function generateSingleProductWhatsAppMessage(input: SingleProductEnquiryInput): string {
  const lines: string[] = [
    "Hello Prestige Tiles,",
    "",
    "I am interested in ordering the following product:",
    "",
    `*Product*: ${input.productName}`,
  ];

  if (input.sku) {
    lines.push(`*SKU*: ${input.sku}`);
  }

  if (input.size) {
    lines.push(`*Size*: ${input.size}`);
  }

  if (input.finish) {
    lines.push(`*Finish*: ${input.finish}`);
  }

  if (input.variant) {
    lines.push(`*Variant*: ${input.variant}`);
  }

  if (input.quantity) {
    const unitStr = input.unit ? ` ${input.unit}` : " Boxes";
    lines.push(`*Quantity*: ${input.quantity}${unitStr}`);
  }

  if (input.price) {
    lines.push(`*Offer Price*: ₹${input.price}`);
  }

  if (input.productUrl) {
    lines.push("", `*Product Link*: ${input.productUrl}`);
  }

  if (input.customNotes) {
    lines.push("", `*Note*: ${input.customNotes}`);
  }

  lines.push("", "Please share pricing and availability details.", "", "Thank you.");

  return lines.join("\n");
}

/**
 * Format a multi-product Enquiry List message for WhatsApp.
 */
export function generateMultiProductWhatsAppMessage(items: EnquiryListItem[]): string {
  const lines: string[] = [
    "Hello Prestige Tiles,",
    "",
    "I would like to enquire about:",
    "",
  ];

  items.forEach((item, index) => {
    lines.push(`${index + 1}. ${item.name}`);
    if (item.sku) lines.push(`   SKU: ${item.sku}`);
    if (item.size) lines.push(`   Size: ${item.size}`);
    if (item.finish) lines.push(`   Finish: ${item.finish}`);
    lines.push(`   Quantity: ${item.quantity} ${item.unit || "Boxes"}`);
    lines.push("");
  });

  lines.push("Please share availability and pricing.", "", "Thank you.");

  return lines.join("\n");
}

/**
 * Helper to construct wa.me URL given phone number and text message.
 */
export function buildWhatsAppLink(whatsappNumber: string, messageText: string): string {
  const cleanNumber = whatsappNumber.replace(/\D/g, "");
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(messageText)}`;
}
