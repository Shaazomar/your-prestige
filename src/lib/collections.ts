import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { resolveImageRef } from "@/lib/s3-url";

/**
 * Named product ranges — Sahara Beige, Kubix Prime, Fonte.
 *
 * These are real rows with real products behind them (the largest hold 300+),
 * and the sitemap has been advertising `/collections/<slug>` for them, but
 * until now only the hand-written `/collections` index existed and every one
 * of those URLs 404'd. `getCollectionBySlug` backs the page that makes them
 * real.
 */

export interface CollectionView {
  slug: string;
  name: string;
  description: string | null;
  image: string | null;
  brandName: string | null;
  brandSlug: string | null;
  count: number;
}

const PUBLISHED = { published: true, deletedAt: null } as const;

export const getCollectionBySlug = cache(
  async (slug: string): Promise<CollectionView | null> => {
    try {
      const row = await prisma.collection.findFirst({
        where: { slug, ...PUBLISHED },
        select: {
          slug: true,
          name: true,
          description: true,
          image: true,
          brand: { select: { name: true, slug: true } },
          _count: { select: { products: { where: PUBLISHED } } },
        },
      });
      if (!row) return null;

      // A collection with nothing published in it is a thin page; it 404s
      // rather than being indexed empty.
      if (row._count.products === 0) return null;

      return {
        slug: row.slug,
        name: row.name,
        description: row.description,
        image: resolveImageRef(row.image) || null,
        brandName: row.brand?.name ?? null,
        brandSlug: row.brand?.slug ?? null,
        count: row._count.products,
      };
    } catch {
      return null;
    }
  }
);

/** Published collections that actually hold products, largest first. */
export const getCollections = cache(async (): Promise<CollectionView[]> => {
  try {
    const rows = await prisma.collection.findMany({
      where: PUBLISHED,
      select: {
        slug: true,
        name: true,
        description: true,
        image: true,
        brand: { select: { name: true, slug: true } },
        _count: { select: { products: { where: PUBLISHED } } },
        // No collection currently carries its own artwork, so the card falls
        // back to a product actually in the range rather than to stock
        // photography of something we do not sell.
        products: {
          where: { ...PUBLISHED, OR: [{ lifestyleImage: { not: null } }, { image_key: { not: null } }] },
          select: { lifestyleImage: true, image_key: true, thumbnail_key: true },
          orderBy: [{ featured: "desc" }, { viewCount: "desc" }],
          take: 1,
        },
      },
      orderBy: { sortOrder: "asc" },
    });
    return rows
      .filter((r) => r._count.products > 0)
      .map((r) => {
        const p = r.products[0];
        return {
          slug: r.slug,
          name: r.name,
          description: r.description,
          image:
            resolveImageRef(r.image) ||
            resolveImageRef(p?.lifestyleImage) ||
            resolveImageRef(p?.image_key) ||
            resolveImageRef(p?.thumbnail_key) ||
            null,
          brandName: r.brand?.name ?? null,
          brandSlug: r.brand?.slug ?? null,
          count: r._count.products,
        };
      })
      .sort((a, b) => b.count - a.count);
  } catch {
    return [];
  }
});
