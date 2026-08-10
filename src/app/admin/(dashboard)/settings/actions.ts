"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import type { Prisma } from "@prisma/client";

export interface BusinessSettings {
  name: string;
  phone: string;
  email: string;
  address: string;
  mapUrl: string;
  hours: string;
  
  // WhatsApp Commerce Settings
  whatsappNumber: string;
  whatsappDisplayName: string;
  whatsappGreeting: string;
  whatsappDefaultMessage: string;
  whatsappBusinessHours: string;
  whatsappEnabled: boolean;
  whatsappFloatingButtonEnabled: boolean;
  whatsappProductButtonEnabled: boolean;
  whatsappEnquiryListEnabled: boolean;
}

export interface ThemeSettings {
  accent: string;
}

const BUSINESS_KEYS = [
  "business.name",
  "business.phone",
  "business.email",
  "business.address",
  "business.mapUrl",
  "business.hours",
  "whatsapp.number",
  "whatsapp.displayName",
  "whatsapp.greeting",
  "whatsapp.defaultMessage",
  "whatsapp.businessHours",
  "whatsapp.enabled",
  "whatsapp.floatingButtonEnabled",
  "whatsapp.productButtonEnabled",
  "whatsapp.enquiryListEnabled",
] as const;

export async function getBusinessSettings(): Promise<BusinessSettings> {
  await requirePermission("settings", "view");
  const rows = await prisma.setting.findMany({ where: { key: { in: [...BUSINESS_KEYS] } } });
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    name: (map["business.name"] as string) ?? "",
    phone: (map["business.phone"] as string) ?? "",
    email: (map["business.email"] as string) ?? "",
    address: (map["business.address"] as string) ?? "",
    mapUrl: (map["business.mapUrl"] as string) ?? "",
    hours: (map["business.hours"] as string) ?? "",
    
    whatsappNumber: (map["whatsapp.number"] as string) ?? "",
    whatsappDisplayName: (map["whatsapp.displayName"] as string) ?? "",
    whatsappGreeting: (map["whatsapp.greeting"] as string) ?? "",
    whatsappDefaultMessage: (map["whatsapp.defaultMessage"] as string) ?? "",
    whatsappBusinessHours: (map["whatsapp.businessHours"] as string) ?? "",
    whatsappEnabled: (map["whatsapp.enabled"] as boolean) ?? true,
    whatsappFloatingButtonEnabled: (map["whatsapp.floatingButtonEnabled"] as boolean) ?? true,
    whatsappProductButtonEnabled: (map["whatsapp.productButtonEnabled"] as boolean) ?? true,
    whatsappEnquiryListEnabled: (map["whatsapp.enquiryListEnabled"] as boolean) ?? true,
  };
}

export async function saveBusinessSettings(data: BusinessSettings) {
  const session = await requirePermission("settings", "settings");
  
  const mappings: Record<string, Prisma.InputJsonValue> = {
    "business.name": data.name,
    "business.phone": data.phone,
    "business.email": data.email,
    "business.address": data.address,
    "business.mapUrl": data.mapUrl,
    "business.hours": data.hours,
    "business.whatsapp": data.whatsappNumber, // mirror Wa number for general general-purpose business WA
    "whatsapp.number": data.whatsappNumber,
    "whatsapp.displayName": data.whatsappDisplayName,
    "whatsapp.greeting": data.whatsappGreeting,
    "whatsapp.defaultMessage": data.whatsappDefaultMessage,
    "whatsapp.businessHours": data.whatsappBusinessHours,
    "whatsapp.enabled": data.whatsappEnabled,
    "whatsapp.floatingButtonEnabled": data.whatsappFloatingButtonEnabled,
    "whatsapp.productButtonEnabled": data.whatsappProductButtonEnabled,
    "whatsapp.enquiryListEnabled": data.whatsappEnquiryListEnabled,
  };

  await prisma.$transaction(
    Object.entries(mappings).map(([k, v]) =>
      prisma.setting.upsert({ where: { key: k }, create: { key: k, value: v }, update: { value: v } })
    )
  );
  await logAudit({ action: "settings.business.update", entity: "Setting", newValue: data, meta: { by: session.user.id } });
}

export async function getThemeSettings(): Promise<ThemeSettings> {
  await requirePermission("settings", "view");
  const row = await prisma.setting.findUnique({ where: { key: "theme.accent" } });
  return { accent: (row?.value as string) ?? "#b3915a" };
}

export async function saveThemeSettings(data: ThemeSettings) {
  const session = await requirePermission("settings", "settings");
  await prisma.setting.upsert({ where: { key: "theme.accent" }, create: { key: "theme.accent", value: data.accent }, update: { value: data.accent } });
  await logAudit({ action: "settings.theme.update", entity: "Setting", newValue: data, meta: { by: session.user.id } });
}

export interface IntegrationStatus {
  name: string;
  configured: boolean;
  envVars: string[];
}

export async function getIntegrationStatuses(): Promise<IntegrationStatus[]> {
  await requirePermission("settings", "view");
  return [
    { name: "Cloudinary (Media Storage)", configured: !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY), envVars: ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"] },
    { name: "Resend (Email)", configured: !!(process.env.RESEND_API_KEY && process.env.EMAIL_FROM), envVars: ["RESEND_API_KEY", "EMAIL_FROM"] },
    { name: "Google Calendar", configured: !!(process.env.GOOGLE_SERVICE_ACCOUNT_JSON && process.env.GOOGLE_CALENDAR_ID), envVars: ["GOOGLE_SERVICE_ACCOUNT_JSON", "GOOGLE_CALENDAR_ID"] },
    { name: "Google Analytics 4", configured: !!(process.env.GA4_PROPERTY_ID && process.env.GOOGLE_ANALYTICS_SERVICE_ACCOUNT_JSON), envVars: ["GA4_PROPERTY_ID", "GOOGLE_ANALYTICS_SERVICE_ACCOUNT_JSON"] },
  ];
}
