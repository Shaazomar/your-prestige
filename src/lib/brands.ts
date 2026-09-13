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

/**
 * The real bathware category labels (Faucets, Showers, ...) — see
 * `getBrandCategories` below. Several brand-website imports (Jaquar, Artize,
 * Essco) stored this exact label in the legacy `collection` string column
 * before real `Category` rows existed for it. Now that `categoryId` carries
 * that meaning, a `collection` value identical to a category label is a
 * leftover duplicate, not a genuine named range — excluded here so the
 * "Collections" rail only ever surfaces true product ranges (Navia, Iris
 * Stone, ...).
 */
const CATEGORY_LABELS = new Set(
  [
    "Faucets", "Showers", "Sanitaryware", "Bath Fittings", "Wellness",
    "Flushing Systems", "Water Heaters", "Shower Enclosures", "Accessories", "Lighting",
  ].map((s) => s.toLowerCase())
);

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
        .filter((r) => !CATEGORY_LABELS.has(r.collection.trim().toLowerCase()))
        .map((r) => ({ name: r.collection, count: r._count._all }))
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
    } catch {
      return [];
    }
  }
);

/** This brand's category breakdown — the spine of its `/brands/[slug]` navigation. */
export const getBrandCategories = cache(
  async (brandSlug: string): Promise<{ slug: string; name: string; count: number }[]> => {
    try {
      const rows = await prisma.product.groupBy({
        by: ["categoryId"],
        where: { published: true, deletedAt: null, brand: { slug: brandSlug } },
        _count: { _all: true },
      });
      const categoryIds = rows.map((r) => r.categoryId).filter((id): id is string => !!id);
      if (categoryIds.length === 0) return [];

      const cats = await prisma.category.findMany({
        where: { id: { in: categoryIds } },
        select: { id: true, slug: true, name: true },
      });
      const byId = new Map(cats.map((c) => [c.id, c]));

      return rows
        .map((r) => {
          const cat = r.categoryId ? byId.get(r.categoryId) : undefined;
          return cat ? { slug: cat.slug, name: cat.name, count: r._count._all } : null;
        })
        .filter((x): x is { slug: string; name: string; count: number } => x !== null)
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
    } catch {
      return [];
    }
  }
);

/**
 * The live "Bathware" category tree (children of the `bathware` parent, with
 * published-product counts) — the single source of truth for `/bathware`
 * navigation and route generation. No hardcoded category list anywhere.
 */
export const getBathwareCategories = cache(
  async (): Promise<{ slug: string; name: string; count: number }[]> => {
    try {
      const parent = await prisma.category.findUnique({ where: { slug: "bathware" }, select: { id: true } });
      if (!parent) return [];

      const children = await prisma.category.findMany({
        where: { parentId: parent.id, published: true, deletedAt: null },
        select: { id: true, slug: true, name: true, sortOrder: true },
        orderBy: { sortOrder: "asc" },
      });
      if (children.length === 0) return [];

      const counts = await prisma.product.groupBy({
        by: ["categoryId"],
        where: {
          published: true,
          deletedAt: null,
          categoryId: { in: children.map((c) => c.id) },
        },
        _count: { _all: true },
      });
      const countById = new Map(counts.map((c) => [c.categoryId, c._count._all]));

      return children
        .map((c) => ({ slug: c.slug, name: c.name, count: countById.get(c.id) ?? 0 }))
        .filter((c) => c.count > 0)
        .sort((a, b) => b.count - a.count);
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
