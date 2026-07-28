"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";

export interface BusinessSettings {
  name: string;
  phone: string;
  email: string;
  address: string;
  mapUrl: string;
  hours: string;
}

export interface ThemeSettings {
  accent: string;
}

const BUSINESS_KEYS = ["business.name", "business.phone", "business.email", "business.address", "business.mapUrl", "business.hours"] as const;

export async function getBusinessSettings(): Promise<BusinessSettings> {
  await requirePermission("settings", "view");
  const rows = await prisma.setting.findMany({ where: { key: { in: [...BUSINESS_KEYS] } } });
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value as string]));
  return {
    name: map["business.name"] ?? "",
    phone: map["business.phone"] ?? "",
    email: map["business.email"] ?? "",
    address: map["business.address"] ?? "",
    mapUrl: map["business.mapUrl"] ?? "",
    hours: map["business.hours"] ?? "",
  };
}

export async function saveBusinessSettings(data: BusinessSettings) {
  const session = await requirePermission("settings", "settings");
  await prisma.$transaction(
    Object.entries(data).map(([k, v]) =>
      prisma.setting.upsert({ where: { key: `business.${k}` }, create: { key: `business.${k}`, value: v }, update: { value: v } })
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
