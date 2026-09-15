import { cache } from "react";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { resolveImageRef } from "@/lib/s3-url";

/**
 * Brand-first catalogue taxonomy.
 *
 * Everything here is derived from the products that actually exist. There is
 * no hardcoded brand list and no global category list handed to every brand:
 * a brand's categories are the categories its own published products sit in,
 * so a route only exists when it has something to show. That is what keeps
 * /brands/jaquar/sanitaryware real and stops /brands/velzone/wellness from
 * being generated because some other brand has wellness products.
 *
 * One product is one row. These are views over `Product`, never copies of it.
 */

/** Only ever count products a visitor could actually reach. */
const PUBLISHED: Prisma.ProductWhereInput = { published: true, deletedAt: null };

export interface CategoryNode {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  image: string | null;
  icon: string | null;
  /** Products in this category *and* everything beneath it. */
  productCount: number;
  children: CategoryNode[];
}

export interface BrandSummary {
  id: string;
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

export interface CollectionSummary {
  id: string;
  slug: string;
  name: string;
  image: string | null;
  productCount: number;
}

// ————— Brands —————

/**
 * Every brand that has at least one published product, with a real count.
 *
 * Brands with nothing to show are dropped rather than rendered as an empty
 * card — the spec's "only create routes for combinations that actually
 * contain products", applied at the top level too.
 */
export const getBrandDirectory = cache(async (): Promise<BrandSummary[]> => {
  const [brands, counts] = await Promise.all([
    prisma.brand.findMany({
      where: { published: true, deletedAt: null },
      orderBy: [{ featured: "desc" }, { sortOrder: "asc" }, { name: "asc" }],
    }),
    // One grouped count for all brands rather than a count per brand.
    prisma.product.groupBy({
      by: ["brandId"],
      where: PUBLISHED,
      _count: { _all: true },
    }),
  ]);

  const countFor = new Map(counts.map((c) => [c.brandId ?? "", c._count._all]));

  return brands
    .map((b) => ({
      id: b.id,
      slug: b.slug,
      name: b.name,
      logo: resolveImageRef(b.logo),
      banner: resolveImageRef(b.banner),
      description: b.description,
      website: b.website,
      catalogPdf: b.catalogPdf,
      featured: b.featured,
      productCount: countFor.get(b.id) ?? 0,
    }))
    .filter((b) => b.productCount > 0);
});

export const getBrandBySlug = cache(async (slug: string): Promise<BrandSummary | null> => {
  const b = await prisma.brand.findFirst({
    where: { slug, published: true, deletedAt: null },
  });
  if (!b) return null;

  const productCount = await prisma.product.count({ where: { ...PUBLISHED, brandId: b.id } });

  return {
    id: b.id,
    slug: b.slug,
    name: b.name,
    logo: resolveImageRef(b.logo),
    banner: resolveImageRef(b.banner),
    description: b.description,
    website: b.website,
    catalogPdf: b.catalogPdf,
    featured: b.featured,
    productCount,
  };
});

// ————— Categories —————

interface CategoryRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  image: string | null;
  icon: string | null;
  parentId: string | null;
  sortOrder: number;
}

const getCategoryRows = cache(async (): Promise<CategoryRow[]> => {
  return prisma.category.findMany({
    where: { published: true, deletedAt: null },
    select: {
      id: true, slug: true, name: true, description: true,
      image: true, icon: true, parentId: true, sortOrder: true,
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
});

/**
 * Direct per-category product counts, optionally scoped to one brand.
 * A single groupBy — not one query per category.
 */
async function directCounts(brandId?: string): Promise<Map<string, number>> {
  const rows = await prisma.product.groupBy({
    by: ["categoryId"],
    where: { ...PUBLISHED, ...(brandId ? { brandId } : {}) },
    _count: { _all: true },
  });
  return new Map(rows.map((r) => [r.categoryId ?? "", r._count._all]));
}

/**
 * Assemble the category forest, rolling child counts up into parents so a
 * top-level "Tiles" card reports everything beneath it rather than only the
 * products pinned directly to it. Branches with no products are pruned.
 */
function buildTree(rows: CategoryRow[], counts: Map<string, number>): CategoryNode[] {
  const childrenOf = new Map<string | null, CategoryRow[]>();
  for (const row of rows) {
    const list = childrenOf.get(row.parentId) ?? [];
    list.push(row);
    childrenOf.set(row.parentId, list);
  }

  const build = (row: CategoryRow): CategoryNode => {
    const children = (childrenOf.get(row.id) ?? []).map(build).filter((c) => c.productCount > 0);
    const own = counts.get(row.id) ?? 0;
    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      description: row.description,
      image: resolveImageRef(row.image),
      icon: row.icon,
      productCount: own + children.reduce((sum, c) => sum + c.productCount, 0),
      children,
    };
  };

  return (childrenOf.get(null) ?? []).map(build).filter((c) => c.productCount > 0);
}

/** The whole published category forest with global counts. */
export const getCategoryTree = cache(async (): Promise<CategoryNode[]> => {
  const [rows, counts] = await Promise.all([getCategoryRows(), directCounts()]);
  return buildTree(rows, counts);
});

/**
 * The categories *this brand* actually sells in — the heart of the
 * brand-aware requirement. Jaquar's tree contains sanitaryware because Jaquar
 * products sit there; Velzone's does not, because none do.
 */
export const getBrandCategoryTree = cache(async (brandId: string): Promise<CategoryNode[]> => {
  const [rows, counts] = await Promise.all([getCategoryRows(), directCounts(brandId)]);
  return buildTree(rows, counts);
});

/** Flatten a forest, depth-first — handy for nav and sitemaps. */
export function flattenCategories(nodes: CategoryNode[]): CategoryNode[] {
  return nodes.flatMap((n) => [n, ...flattenCategories(n.children)]);
}

export const getCategoryBySlug = cache(async (slug: string) => {
  return prisma.category.findFirst({
    where: { slug, published: true, deletedAt: null },
    select: {
      id: true, slug: true, name: true, description: true,
      image: true, icon: true, parentId: true,
    },
  });
});

/**
 * A category's id plus every descendant id.
 *
 * Browsing "Tiles" has to include products filed under "Tiles → GVT", so the
 * query needs the whole subtree. A recursive CTE resolves it in one round trip
 * at any depth, instead of walking the tree level by level from the app.
 */
export const getCategoryBranchIds = cache(async (categoryId: string): Promise<string[]> => {
  const rows = await prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
    WITH RECURSIVE branch AS (
      SELECT id FROM "Category" WHERE id = ${categoryId}
      UNION ALL
      SELECT c.id FROM "Category" c JOIN branch b ON c."parentId" = b.id
    )
    SELECT id FROM branch
  `);
  return rows.map((r) => r.id);
});

/** Ancestor chain, root first — powers breadcrumbs without N queries. */
export const getCategoryAncestors = cache(async (categoryId: string) => {
  const rows = await prisma.$queryRaw<{ id: string; slug: string; name: string; depth: number }[]>(
    Prisma.sql`
      WITH RECURSIVE chain AS (
        SELECT id, slug, name, "parentId", 0 AS depth
        FROM "Category" WHERE id = ${categoryId}
        UNION ALL
        SELECT c.id, c.slug, c.name, c."parentId", chain.depth + 1
        FROM "Category" c JOIN chain ON chain."parentId" = c.id
      )
      SELECT id, slug, name, depth FROM chain ORDER BY depth DESC
    `
  );
  return rows.map(({ id, slug, name }) => ({ id, slug, name }));
});

// ————— Collections —————

/** Collections this brand actually has products in, most populous first. */
export const getBrandCollections = cache(
  async (brandId: string, limit = 12): Promise<CollectionSummary[]> => {
    const grouped = await prisma.product.groupBy({
      by: ["collectionId"],
      where: { ...PUBLISHED, brandId, collectionId: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { collectionId: "desc" } },
      take: limit,
    });

    const ids = grouped.map((g) => g.collectionId).filter((id): id is string => !!id);
    if (ids.length === 0) return [];

    const rows = await prisma.collection.findMany({
      where: { id: { in: ids }, published: true, deletedAt: null },
      select: { id: true, slug: true, name: true, image: true },
    });
    const byId = new Map(rows.map((r) => [r.id, r]));

    return grouped
      .map((g) => {
        const c = g.collectionId ? byId.get(g.collectionId) : undefined;
        if (!c) return null;
        return {
          id: c.id,
          slug: c.slug,
          name: c.name,
          image: resolveImageRef(c.image),
          productCount: g._count._all,
        };
      })
      .filter((c): c is CollectionSummary => c !== null);
  }
);
