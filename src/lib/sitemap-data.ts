import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { absoluteUrl } from "@/lib/seo-config";
import { PRODUCT_INCLUDE, resolveCategory, PUBLIC_PRODUCT_WHERE } from "@/lib/products";

/**
 * Shared sitemap sources.
 *
 * The catalogue is 6,000+ products, so the sitemap is split into an index plus
 * per-section files rather than one document rebuilt from scratch on every
 * request. Each section route sets its own `revalidate`, so a crawler hitting
 * /sitemap-products.xml gets a cached response instead of a full table scan.
 *
 * Every query here selects only slug + updatedAt. `lastmod` comes from
 * `updatedAt`, so a crawler can tell what actually changed.
 */

export interface SitemapRow {
  url: string;
  lastModified: Date;
  changeFrequency: "daily" | "weekly" | "monthly";
  priority: number;
}

/** Hard cap per sitemap file — the protocol's own limit is 50,000. */
export const SITEMAP_PAGE_SIZE = 5000;

const PUBLISHED = { published: true, deletedAt: null } as const;

/**
 * Top-level categories that have a page under `src/app/(site)`. Adding a
 * section route means adding its slug here — the sitemap must never list a URL
 * the app cannot serve.
 */
const SECTION_ROUTES = new Set(["tiles", "bathware"]);

export const getProductSitemapRows = cache(async (page = 0): Promise<SitemapRow[]> => {
  try {
    const rows = await prisma.product.findMany({
      where: PUBLIC_PRODUCT_WHERE,
      // The same include the product page resolves its section from — a
      // sitemap URL that isn't the page's own canonical is a duplicate the
      // crawler was told about by us.
      select: { slug: true, updatedAt: true, designerPick: true, ...PRODUCT_INCLUDE },
      orderBy: { createdAt: "asc" },
      skip: page * SITEMAP_PAGE_SIZE,
      take: SITEMAP_PAGE_SIZE,
    });
    return rows.map((r) => ({
      url: absoluteUrl(`/products/${resolveCategory(r)}/${r.slug}`),
      lastModified: r.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch {
    return [];
  }
});

/**
 * Local-SEO landing pages served at root URLs — `/tiles-mangaluru`,
 * `/jaquar-dealer-mangaluru`. Real, individually written pages (see
 * `scripts/seed-landing-pages.mjs`) exist and are servable by
 * `src/app/(site)/[landing]/page.tsx`, but nothing ever listed them here, so
 * a crawler could only find one by already knowing its exact URL — no
 * internal link on the site pointed at any of them either.
 */
export const getLandingPageSitemapRows = cache(async (): Promise<SitemapRow[]> => {
  try {
    const rows = await prisma.landingPage.findMany({
      where: PUBLISHED,
      select: { slug: true, updatedAt: true },
    });
    return rows.map((r) => ({
      url: absoluteUrl(`/${r.slug}`),
      lastModified: r.updatedAt,
      changeFrequency: "monthly" as const,
      // Above a product page, on par with a category page: these target real
      // local search demand ("tiles in Mangalore") and are genuinely distinct
      // content, not a thin duplicate.
      priority: 0.8,
    }));
  } catch {
    return [];
  }
});

export const countPublishedProducts = cache(async (): Promise<number> => {
  try {
    return await prisma.product.count({ where: PUBLIC_PRODUCT_WHERE });
  } catch {
    return 0;
  }
});

export const getBrandSitemapRows = cache(async (): Promise<SitemapRow[]> => {
  try {
    const brands = await prisma.brand.findMany({
      where: PUBLISHED,
      select: {
        slug: true,
        updatedAt: true,
        products: {
          where: PUBLIC_PRODUCT_WHERE,
          select: { category: { select: { slug: true } } },
          // Enough to cover a brand's category set without loading its catalogue.
          take: 500,
        },
      },
    });

    const rows: SitemapRow[] = [];
    for (const b of brands) {
      if (b.products.length === 0) continue;
      rows.push({
        url: absoluteUrl(`/brands/${b.slug}`),
        lastModified: b.updatedAt,
        changeFrequency: "weekly",
        priority: 0.8,
      });
      // Only brand x category combinations that actually hold products, so the
      // sitemap never advertises a URL that 404s.
      const categories = new Set(
        b.products.map((p) => p.category?.slug).filter((s): s is string => !!s)
      );
      for (const slug of categories) {
        rows.push({
          url: absoluteUrl(`/brands/${b.slug}/${slug}`),
          lastModified: b.updatedAt,
          changeFrequency: "weekly",
          priority: 0.7,
        });
      }
    }
    return rows;
  } catch {
    return [];
  }
});

export const getCategorySitemapRows = cache(async (): Promise<SitemapRow[]> => {
  try {
    const [sections, collections] = await Promise.all([
      prisma.category.findMany({
        where: { ...PUBLISHED, parentId: null },
        select: {
          slug: true,
          updatedAt: true,
          // Two levels: the tree is three deep, and `/bathware/spa-systems`
          // is a real page holding real products. Listing only the direct
          // children left the third level — three quarters of the catalogue's
          // products — with no category URL in the sitemap at all.
          children: {
            where: PUBLISHED,
            select: {
              slug: true,
              updatedAt: true,
              children: { where: PUBLISHED, select: { slug: true, updatedAt: true } },
            },
          },
        },
      }),
      prisma.collection.findMany({
        where: PUBLISHED,
        select: { slug: true, updatedAt: true },
      }),
    ]);

    const rows: SitemapRow[] = [];
    for (const s of sections) {
      // Only the sections that have a route. A root Category row without one
      // (an import artifact, a category created in the CMS before its page
      // exists) would otherwise be advertised to crawlers as a 404.
      if (!SECTION_ROUTES.has(s.slug)) continue;
      rows.push({
        url: absoluteUrl(`/${s.slug}`),
        lastModified: s.updatedAt,
        changeFrequency: "weekly",
        priority: 0.9,
      });
      for (const c of s.children) {
        rows.push({
          url: absoluteUrl(`/${s.slug}/${c.slug}`),
          lastModified: c.updatedAt,
          changeFrequency: "weekly",
          priority: 0.8,
        });
        // Grandchildren live at the same one-level-deep address as their
        // parent — `/bathware/spa-systems`, not `/bathware/wellness/spa-systems`
        // — because the section route resolves any category in its subtree.
        for (const g of c.children) {
          rows.push({
            url: absoluteUrl(`/${s.slug}/${g.slug}`),
            lastModified: g.updatedAt,
            changeFrequency: "weekly",
            priority: 0.7,
          });
        }
      }
    }
    for (const c of collections) {
      rows.push({
        url: absoluteUrl(`/collections/${c.slug}`),
        lastModified: c.updatedAt,
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
    return rows;
  } catch {
    return [];
  }
});
