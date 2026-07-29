import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { brands as fallbackBrandNames } from "@/lib/demo-content";

/**
 * Brand directory, read from the CMS.
 *
 * Catalogue imports create Brand rows automatically (a PDF's running header is
 * usually the brand name), so this list grows on its own as ranges are
 * imported. Falls back to the bundled name list when the database is empty or
 * unreachable, matching how the product catalogue behaves.
 */

export interface BrandView {
  slug: string;
  name: string;
  logo: string | null;
  banner: string | null;
  description: string | null;
  website: string | null;
  catalogPdf: string | null;
  featured: boolean;
  productCount: number;
}

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

export const getBrands = cache(async (): Promise<BrandView[]> => {
  try {
    const rows = await prisma.brand.findMany({
      where: { published: true, deletedAt: null },
      orderBy: [{ featured: "desc" }, { sortOrder: "asc" }, { name: "asc" }],
      include: {
        _count: { select: { products: { where: { published: true, deletedAt: null } } } },
      },
    });
    if (rows.length === 0) return fallbackBrands();

    return rows.map((b) => ({
      slug: b.slug,
      name: b.name,
      logo: b.logo,
      banner: b.banner,
      description: b.description,
      website: b.website,
      catalogPdf: b.catalogPdf,
      featured: b.featured,
      productCount: b._count.products,
    }));
  } catch {
    return fallbackBrands();
  }
});

export const getBrandBySlug = cache(async (slug: string): Promise<BrandView | null> => {
  try {
    const b = await prisma.brand.findFirst({
      where: { slug, published: true, deletedAt: null },
      include: {
        _count: { select: { products: { where: { published: true, deletedAt: null } } } },
      },
    });
    if (!b) return null;
    return {
      slug: b.slug,
      name: b.name,
      logo: b.logo,
      banner: b.banner,
      description: b.description,
      website: b.website,
      catalogPdf: b.catalogPdf,
      featured: b.featured,
      productCount: b._count.products,
    };
  } catch {
    return null;
  }
});

/** Collections this brand has in the catalogue — the spine of its library page. */
export const getBrandCollections = cache(
  async (brandSlug: string): Promise<{ name: string; count: number }[]> => {
    try {
      const rows = await prisma.product.groupBy({
        by: ["collection"],
        where: { published: true, deletedAt: null, brand: { slug: brandSlug } },
        _count: { _all: true },
      });
      return rows
        .filter((r): r is typeof r & { collection: string } => !!r.collection)
        .map((r) => ({ name: r.collection, count: r._count._all }))
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
    } catch {
      return [];
    }
  }
);

function fallbackBrands(): BrandView[] {
  return fallbackBrandNames.map((name) => ({
    slug: slugify(name),
    name,
    logo: null,
    banner: null,
    description: null,
    website: null,
    catalogPdf: null,
    featured: false,
    productCount: 0,
  }));
}
