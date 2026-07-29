import { cache } from "react";
import { prisma } from "@/lib/prisma";

/**
 * Keyword landing pages served at root URLs (/tiles-mangaluru).
 *
 * Every field is CMS-managed so each page can carry genuinely distinct copy.
 * That matters more than it sounds: eight near-identical pages differing only
 * by place name is the textbook definition of a doorway page, which Google
 * demotes rather than ranks. The seed writes real, different content per
 * location, and the admin module exists so it stays that way.
 */

export interface LandingBlock {
  type?: string;
  heading?: string;
  body?: string;
  image?: string;
}

export interface LandingPageView {
  id: string;
  slug: string;
  kind: string;
  title: string;
  heading: string;
  subheading: string | null;
  intro: string | null;
  blocks: LandingBlock[];
  city: string | null;
  locality: string | null;
  areaServed: string[];
  serviceType: string | null;
  heroImage: string | null;
  gallery: string[];
  faqs: { q: string; a: string }[];
  showroomIds: string[];
  featuredProductIds: string[];
  jsonLd: string | null;
}

const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

function toView(row: {
  id: string; slug: string; kind: string; title: string; heading: string;
  subheading: string | null; intro: string | null; blocks: unknown;
  city: string | null; locality: string | null; areaServed: unknown;
  serviceType: string | null; heroImage: string | null; gallery: unknown;
  faqs: unknown; showroomIds: unknown; featuredProductIds: unknown; jsonLd: string | null;
}): LandingPageView {
  return {
    id: row.id,
    slug: row.slug,
    kind: row.kind,
    title: row.title,
    heading: row.heading,
    subheading: row.subheading,
    intro: row.intro,
    blocks: arr<LandingBlock>(row.blocks),
    city: row.city,
    locality: row.locality,
    areaServed: arr<string>(row.areaServed),
    serviceType: row.serviceType,
    heroImage: row.heroImage,
    gallery: arr<string>(row.gallery),
    faqs: arr<{ q: string; a: string }>(row.faqs),
    showroomIds: arr<string>(row.showroomIds),
    featuredProductIds: arr<string>(row.featuredProductIds),
    jsonLd: row.jsonLd,
  };
}

export const getLandingPages = cache(async (): Promise<LandingPageView[]> => {
  try {
    const rows = await prisma.landingPage.findMany({
      where: { published: true, deletedAt: null },
      orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    });
    return rows.map(toView);
  } catch {
    return [];
  }
});

export const getLandingPage = cache(async (slug: string): Promise<LandingPageView | null> => {
  try {
    const row = await prisma.landingPage.findFirst({
      where: { slug, published: true, deletedAt: null },
    });
    return row ? toView(row) : null;
  } catch {
    return null;
  }
});

/**
 * Slugs the root `[landing]` segment is allowed to serve.
 *
 * Returned from generateStaticParams as an explicit allowlist. The segment
 * cannot shadow a real route — Next resolves static segments like /about and
 * /products first — but keeping the list explicit means an unknown path still
 * reaches the existing not-found page rather than a database round trip.
 */
export async function getLandingSlugs(): Promise<string[]> {
  try {
    const rows = await prisma.landingPage.findMany({
      where: { published: true, deletedAt: null },
      select: { slug: true },
    });
    return rows.map((r) => r.slug);
  } catch {
    return [];
  }
}
