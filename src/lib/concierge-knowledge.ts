import { prisma } from "@/lib/prisma";
import { getBusiness } from "@/lib/business";

/**
 * Knowledge base the concierge answers from — assembled live from the CMS
 * (products, brands, showrooms, FAQs, blog, business settings) so answers
 * always reflect what's actually published, with no duplicated copy.
 *
 * Cached briefly in-process: the concierge is chatty and this avoids
 * re-querying six tables on every message.
 */

export interface ConciergeKnowledge {
  business: Awaited<ReturnType<typeof getBusiness>>;
  showrooms: {
    slug: string; name: string; locality: string | null; city: string;
    phone: string; whatsapp: string | null; hoursWeekdays: string; hoursSunday: string;
    brands: string[]; address: string; isFlagship: boolean;
  }[];
  products: { slug: string; name: string; collection: string | null; category: string | null; brand: string | null; finish: string | null; sizes: string[]; applications: string[] }[];
  brands: string[];
  faqs: { question: string; answer: string }[];
  posts: { slug: string; title: string; excerpt: string | null }[];
}

let cache: { data: ConciergeKnowledge; at: number } | null = null;
const TTL_MS = 60_000;

const arr = (v: unknown): string[] => (Array.isArray(v) ? (v as string[]) : []);

export async function getConciergeKnowledge(): Promise<ConciergeKnowledge> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.data;

  const [business, showroomRows, productRows, brandRows, faqRows, postRows] = await Promise.all([
    getBusiness(),
    prisma.showroom.findMany({
      where: { published: true, deletedAt: null },
      orderBy: [{ isFlagship: "desc" }, { sortOrder: "asc" }],
    }),
    prisma.product.findMany({
      where: { published: true, deletedAt: null },
      include: { category: { select: { slug: true } }, brand: { select: { name: true } } },
      take: 200,
    }),
    prisma.brand.findMany({
      where: { published: true, deletedAt: null },
      select: { name: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.faq.findMany({
      where: { published: true, deletedAt: null },
      orderBy: { sortOrder: "asc" },
      select: { question: true, answer: true },
    }),
    prisma.post.findMany({
      where: { published: true, deletedAt: null },
      orderBy: { publishedAt: "desc" },
      take: 20,
      select: { slug: true, title: true, excerpt: true },
    }),
  ]);

  const data: ConciergeKnowledge = {
    business,
    showrooms: showroomRows.map((s) => ({
      slug: s.slug,
      name: s.name,
      locality: s.locality,
      city: s.city,
      phone: s.phone,
      whatsapp: s.whatsapp,
      hoursWeekdays: s.hoursWeekdays,
      hoursSunday: s.hoursSunday,
      brands: arr(s.brands),
      address: [s.addressLine, s.locality, s.city].filter(Boolean).join(", "),
      isFlagship: s.isFlagship,
    })),
    products: productRows.map((p) => ({
      slug: p.slug,
      name: p.name,
      collection: p.collection,
      category: p.category?.slug ?? null,
      brand: p.brand?.name ?? null,
      finish: p.finish,
      sizes: arr(p.sizes),
      applications: arr(p.applications),
    })),
    brands: brandRows.map((b) => b.name),
    faqs: faqRows,
    posts: postRows,
  };

  cache = { data, at: Date.now() };
  return data;
}

/** Invalidate the cache — call after CMS mutations if you need instant freshness. */
export function clearConciergeKnowledgeCache() {
  cache = null;
}
