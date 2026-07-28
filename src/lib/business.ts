import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { business as fallback } from "@/lib/site-config";

export interface BusinessRecord {
  name: string;
  legalName: string;
  tagline: string;
  description: string;
  phone: string;
  whatsapp: string;
  email: string;
  website: string;
  address: string;
  mapUrl: string;
  hoursWeekdays: string;
  hoursSunday: string;
  instagram: string;
  facebook: string;
  threads: string;
}

const KEYS = [
  "business.name", "business.legalName", "business.tagline", "business.description",
  "business.phone", "business.whatsapp", "business.email", "business.website",
  "business.address", "business.mapUrl", "business.hoursWeekdays", "business.hoursSunday",
  "social.instagram", "social.facebook", "social.threads",
] as const;

/**
 * Single source of truth for business details on the public site.
 * Reads the CMS-managed `Setting` rows, falling back to `site-config.ts`
 * for any key that hasn't been seeded yet. `cache()` dedupes the query
 * across a single server render pass.
 */
export const getBusiness = cache(async (): Promise<BusinessRecord> => {
  let map: Record<string, unknown> = {};
  try {
    const rows = await prisma.setting.findMany({ where: { key: { in: [...KEYS] } } });
    map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  } catch {
    // DB unreachable (e.g. during a build with no database) — use fallbacks.
  }

  const str = (key: string, fb: string) => {
    const v = map[key];
    return typeof v === "string" && v.length > 0 ? v : fb;
  };
  // Blank-by-design fields must be able to stay blank, so they read the raw
  // stored value without falling back to a placeholder.
  const optional = (key: string) => {
    const v = map[key];
    return typeof v === "string" ? v : "";
  };

  return {
    name: str("business.name", fallback.name),
    legalName: str("business.legalName", fallback.legalName),
    tagline: str("business.tagline", fallback.tagline),
    description: str("business.description", fallback.description),
    phone: str("business.phone", fallback.phone),
    whatsapp: str("business.whatsapp", fallback.whatsapp),
    email: optional("business.email"),
    website: optional("business.website"),
    address: str("business.address", `${fallback.address.street}, ${fallback.address.locality}, ${fallback.address.city}`),
    mapUrl: str("business.mapUrl", fallback.mapUrl),
    hoursWeekdays: str("business.hoursWeekdays", fallback.hours.weekdays),
    hoursSunday: str("business.hoursSunday", fallback.hours.sunday),
    instagram: str("social.instagram", fallback.social.instagram),
    facebook: str("social.facebook", fallback.social.facebook),
    threads: str("social.threads", fallback.social.threads),
  };
});

/** Digits-only phone, safe for `tel:` and `wa.me` links. */
export function telHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

export function waHref(whatsapp: string, message?: string) {
  const num = whatsapp.replace(/\D/g, "");
  return `https://wa.me/${num}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
}
