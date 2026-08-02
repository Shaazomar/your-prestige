import { applicationList, type Application } from "@/lib/catalog";

/**
 * The `Application` union is deliberately closed: `ApplicationBadge` maps every
 * member to an icon, and the filter rail renders one chip per member. Catalogue
 * PDFs, though, use whatever vocabulary the brand's copywriter felt like —
 * "balcony", "washroom", "false ceiling", "pooja room".
 *
 * So every application word crossing the boundary from a PDF (or from a hand-
 * typed admin field) goes through here first. Anything that maps lands in
 * `Product.applications`; anything that doesn't is preserved verbatim in
 * `Product.applicationTags`, where it still feeds search and meta keywords.
 * Nothing is silently discarded, and the union never grows unexpectedly.
 */

const SYNONYMS: Record<Application, string[]> = {
  "Living Room": ["living", "livingroom", "hall", "drawing", "drawing room", "lounge", "family room", "sitting"],
  Bedroom: ["bed", "bedroom", "master bedroom", "guest room", "kids room", "children room"],
  Bathroom: ["bath", "bathroom", "washroom", "wc", "toilet", "powder room", "shower", "sanitary", "wet area", "wet wall", "ensuite", "en-suite"],
  Kitchen: ["kitchen", "kitchen wall", "backsplash", "back splash", "dado", "countertop", "counter top", "pantry", "utility"],
  Outdoor: ["outdoor", "exterior", "external", "balcony", "terrace", "patio", "porch", "deck", "facade", "façade", "elevation", "driveway", "parking", "garden", "landscape", "pool", "poolside", "swimming pool", "car porch", "sit out", "sitout", "verandah", "veranda", "roof"],
  Commercial: ["commercial", "retail", "shop", "showroom", "mall", "supermarket", "airport", "metro", "station", "public", "high traffic", "heavy traffic", "industrial", "warehouse", "institutional", "school", "college", "university"],
  Hotel: ["hotel", "hospitality", "resort", "lobby", "banquet", "spa"],
  Villa: ["villa", "bungalow", "residence", "residential", "home", "house", "apartment", "flat", "duplex", "penthouse"],
  Office: ["office", "workspace", "work space", "corporate", "coworking", "co-working", "conference", "reception", "cabin"],
  Restaurant: ["restaurant", "cafe", "café", "bar", "dining", "diner", "food court", "kitchenette", "bistro", "pub"],
  Hospital: ["hospital", "clinic", "healthcare", "health care", "medical", "lab", "laboratory", "pharmacy", "nursing"],
};

/** Longest-phrase-first so "living room" beats a stray "room" match. */
const LOOKUP: { needle: string; app: Application }[] = (
  Object.entries(SYNONYMS) as [Application, string[]][]
)
  .flatMap(([app, needles]) => [app.toLowerCase(), ...needles].map((needle) => ({ needle, app })))
  .sort((a, b) => b.needle.length - a.needle.length);

const EXACT = new Set(applicationList.map((a) => a.toLowerCase()));

/** Map one free-text word/phrase onto the union, or null if it doesn't fit. */
export function normaliseApplication(raw: string): Application | null {
  const q = raw.trim().toLowerCase().replace(/[_/]+/g, " ").replace(/\s+/g, " ");
  if (!q) return null;

  if (EXACT.has(q)) {
    return applicationList.find((a) => a.toLowerCase() === q) ?? null;
  }
  // Word-boundary match so "bar" doesn't fire on "barn" and "spa" doesn't
  // fire on "space" — a substring test gets both of those wrong.
  for (const { needle, app } of LOOKUP) {
    if (new RegExp(`(^|\\W)${escapeRe(needle)}(\\W|$)`).test(q)) return app;
  }
  return null;
}

/** Split a list into recognised union members and leftover free text. */
export function normaliseApplications(raw: string[]): {
  applications: Application[];
  tags: string[];
} {
  const applications: Application[] = [];
  const tags: string[] = [];

  for (const item of raw) {
    // Catalogues love "Living Room / Bedroom, Kitchen" in one cell.
    for (const part of item.split(/[,;|/•]+/)) {
      const value = part.trim();
      if (!value) continue;
      const app = normaliseApplication(value);
      if (app) {
        if (!applications.includes(app)) applications.push(app);
      } else if (!tags.includes(value)) {
        tags.push(value);
      }
    }
  }
  return { applications, tags };
}

/**
 * Coerce a stored `Json?` column back into the union, dropping anything that
 * doesn't belong. Used on the read path so a hand-edited DB row or a value
 * written before this normaliser existed can never crash the icon lookup.
 */
export function toApplications(value: unknown): Application[] {
  if (!Array.isArray(value)) return [];
  const out: Application[] = [];
  for (const v of value) {
    if (typeof v !== "string") continue;
    const app = normaliseApplication(v);
    if (app && !out.includes(app)) out.push(app);
  }
  return out;
}

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const u = (id: string) => `https://images.unsplash.com/${id}?q=80&w=1200&auto=format&fit=crop`;

export interface ApplicationItem {
  slug: string;
  title: string;
  description: string;
  image: string;
  count: string;
}

export const applicationsData: ApplicationItem[] = [
  {
    slug: "living-room",
    title: "Living Room & Foyer",
    description: "Grand format book-matched marble slabs & high-gloss vitrified tiles.",
    image: u("photo-1600585154340-be6161a56a0c"),
    count: "42 Collections",
  },
  {
    slug: "kitchen",
    title: "Kitchen & Countertops",
    description: "Stain-proof 12mm ultra-compact quartz slabs for seamless island waterfalls.",
    image: u("photo-1600210492486-724fe5c67fb0"),
    count: "28 Collections",
  },
  {
    slug: "bathroom",
    title: "Bathroom & Wellness Spa",
    description: "Anti-bacterial ceramic tiles and freestanding acrylic soaking tubs.",
    image: u("photo-1600566753190-17f0baa2a6c3"),
    count: "35 Collections",
  },
  {
    slug: "bedroom",
    title: "Bedroom & Suite",
    description: "Soft tactile warm wood-plank porcelain and acoustic acoustic tiles.",
    image: u("photo-1616594039964-ae9021a400a0"),
    count: "18 Collections",
  },
  {
    slug: "outdoor",
    title: "Outdoor & Verandah",
    description: "20mm heavy-duty anti-slip pavers for pool decks and monsoon walkways.",
    image: u("photo-1600047509807-ba8f99d2cdde"),
    count: "24 Collections",
  },
  {
    slug: "commercial",
    title: "Commercial & Malls",
    description: "High-traffic wear-resistant vitrified flooring engineered for heavy footfall.",
    image: u("photo-1541123437800-1bb1317badc2"),
    count: "30 Collections",
  },
  {
    slug: "hospitality",
    title: "Hospitality & Resorts",
    description: "Bespoke luxury surfaces designed for 5-star hotel lobbies and fine dining.",
    image: u("photo-1566073771259-6a8506099945"),
    count: "25 Collections",
  },
  {
    slug: "healthcare",
    title: "Healthcare & Clinics",
    description: "Hygienic, zero-porosity, chemical-resistant specialized wall cladding.",
    image: u("photo-1519494026892-80bbd2d6fd0d"),
    count: "15 Collections",
  },
  {
    slug: "education",
    title: "Education & Institutional",
    description: "Durable, low-maintenance surfaces for auditoriums and university campuses.",
    image: u("photo-1562774053-701939374585"),
    count: "12 Collections",
  },
  {
    slug: "office",
    title: "Corporate Offices",
    description: "Architectural minimal grey basalt and honed concrete look slabs.",
    image: u("photo-1497366216548-37526070297c"),
    count: "20 Collections",
  },
];

