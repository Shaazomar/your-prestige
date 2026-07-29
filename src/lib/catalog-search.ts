import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { toCatalogProduct } from "@/lib/products";
import type { CatalogProduct } from "@/lib/catalog";

/**
 * Server-side catalogue search and faceting.
 *
 * `CatalogExplorer` filters in the browser from the full product array, which
 * is fine for a curated set and stops being fine once an imported catalogue
 * runs to thousands. This module moves both the filtering *and* the facet
 * counts into Postgres, so the page ships one page of results instead of the
 * entire range.
 *
 * Scalar facets (brand, finish, material, colour) come from `groupBy`. The
 * array-valued ones (sizes, applications) can't — Prisma has no notion of
 * grouping by an element inside a `Json` column — so those use a raw
 * `jsonb_array_elements_text` query, which is the whole reason those two
 * facets are computed separately below.
 */

export interface CatalogFilters {
  q?: string;
  category?: string;
  brand?: string;
  collection?: string;
  finish?: string;
  material?: string;
  color?: string;
  size?: string;
  application?: string;
  page?: number;
  perPage?: number;
  sort?: "featured" | "newest" | "name";
}

export interface Facet {
  value: string;
  count: number;
}

export interface CatalogSearchResult {
  products: CatalogProduct[];
  total: number;
  page: number;
  perPage: number;
  pageCount: number;
  facets: {
    brands: Facet[];
    collections: Facet[];
    finishes: Facet[];
    materials: Facet[];
    colors: Facet[];
    sizes: Facet[];
    applications: Facet[];
  };
}

export const DEFAULT_PER_PAGE = 24;

const PRODUCT_INCLUDE = {
  category: { select: { slug: true, name: true } },
  brand: { select: { name: true } },
} satisfies Prisma.ProductInclude;

/** Parse URL search params into typed filters. */
export function parseFilters(sp: Record<string, string | string[] | undefined>): CatalogFilters {
  const one = (k: string) => {
    const v = sp[k];
    return typeof v === "string" && v.trim() ? v.trim() : undefined;
  };
  const page = Number(one("page") ?? 1);
  const sort = one("sort");
  return {
    q: one("q"),
    category: one("category"),
    brand: one("brand"),
    collection: one("collection"),
    finish: one("finish"),
    material: one("material"),
    color: one("colour") ?? one("color"),
    size: one("size"),
    application: one("room") ?? one("application"),
    page: Number.isFinite(page) && page > 0 ? Math.floor(page) : 1,
    sort: sort === "newest" || sort === "name" ? sort : "featured",
  };
}

function buildWhere(f: CatalogFilters): Prisma.ProductWhereInput {
  const and: Prisma.ProductWhereInput[] = [{ published: true, deletedAt: null }];

  if (f.category) and.push({ category: { slug: f.category } });
  if (f.brand) and.push({ brand: { name: { equals: f.brand, mode: "insensitive" } } });
  if (f.collection) and.push({ collection: { equals: f.collection, mode: "insensitive" } });
  if (f.finish) and.push({ finish: { equals: f.finish, mode: "insensitive" } });
  if (f.material) and.push({ material: { equals: f.material, mode: "insensitive" } });
  if (f.color) and.push({ color: { equals: f.color, mode: "insensitive" } });

  // Array columns: exact element containment.
  if (f.size) and.push({ sizes: { array_contains: f.size } });
  if (f.application) and.push({ applications: { array_contains: f.application } });

  if (f.q) {
    and.push({
      OR: [
        { name: { contains: f.q, mode: "insensitive" } },
        { collection: { contains: f.q, mode: "insensitive" } },
        { description: { contains: f.q, mode: "insensitive" } },
        { productCode: { contains: f.q, mode: "insensitive" } },
        { finish: { contains: f.q, mode: "insensitive" } },
        { material: { contains: f.q, mode: "insensitive" } },
        { color: { contains: f.q, mode: "insensitive" } },
        { brand: { name: { contains: f.q, mode: "insensitive" } } },
      ],
    });
  }

  return { AND: and };
}

function buildOrder(sort: CatalogFilters["sort"]): Prisma.ProductOrderByWithRelationInput[] {
  if (sort === "newest") return [{ createdAt: "desc" }];
  if (sort === "name") return [{ name: "asc" }];
  return [{ featured: "desc" }, { viewCount: "desc" }, { createdAt: "desc" }];
}

export async function searchCatalog(filters: CatalogFilters): Promise<CatalogSearchResult> {
  const perPage = filters.perPage ?? DEFAULT_PER_PAGE;
  const page = filters.page ?? 1;
  const where = buildWhere(filters);

  try {
    const [rows, total, facets] = await Promise.all([
      prisma.product.findMany({
        where,
        include: PRODUCT_INCLUDE,
        orderBy: buildOrder(filters.sort),
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.product.count({ where }),
      // Facets deliberately reflect the *unfiltered* category scope, so a
      // visitor can always see — and switch to — the other options rather than
      // being funnelled into a dead end by their own first click.
      computeFacets({ category: filters.category }),
    ]);

    return {
      products: rows.map(toCatalogProduct),
      total,
      page,
      perPage,
      pageCount: Math.max(1, Math.ceil(total / perPage)),
      facets,
    };
  } catch {
    return {
      products: [],
      total: 0,
      page: 1,
      perPage,
      pageCount: 1,
      facets: { brands: [], collections: [], finishes: [], materials: [], colors: [], sizes: [], applications: [] },
    };
  }
}

async function computeFacets(scope: { category?: string }): Promise<CatalogSearchResult["facets"]> {
  const where: Prisma.ProductWhereInput = {
    published: true,
    deletedAt: null,
    ...(scope.category ? { category: { slug: scope.category } } : {}),
  };

  const [byBrand, byCollection, byFinish, byMaterial, byColor, sizes, applications] = await Promise.all([
    prisma.product.groupBy({ by: ["brandId"], where, _count: { _all: true } }),
    prisma.product.groupBy({ by: ["collection"], where, _count: { _all: true } }),
    prisma.product.groupBy({ by: ["finish"], where, _count: { _all: true } }),
    prisma.product.groupBy({ by: ["material"], where, _count: { _all: true } }),
    prisma.product.groupBy({ by: ["color"], where, _count: { _all: true } }),
    jsonArrayFacet("sizes", scope.category),
    jsonArrayFacet("applications", scope.category),
  ]);

  // groupBy returns brand ids; resolve them to names in one query.
  const brandIds = byBrand.map((b) => b.brandId).filter((id): id is string => !!id);
  const brands = brandIds.length
    ? await prisma.brand.findMany({ where: { id: { in: brandIds } }, select: { id: true, name: true } })
    : [];
  const brandName = new Map(brands.map((b) => [b.id, b.name]));

  const clean = <T extends { _count: { _all: number } }>(
    rows: T[],
    pick: (r: T) => string | null | undefined
  ): Facet[] =>
    rows
      .map((r) => ({ value: pick(r) ?? "", count: r._count._all }))
      .filter((f) => f.value.length > 0)
      .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));

  return {
    brands: clean(byBrand, (r) => brandName.get(r.brandId ?? "")),
    collections: clean(byCollection, (r) => r.collection),
    finishes: clean(byFinish, (r) => r.finish),
    materials: clean(byMaterial, (r) => r.material),
    colors: clean(byColor, (r) => r.color),
    sizes,
    applications,
  };
}

/**
 * Facet counts for a `Json` array column.
 *
 * `jsonb_array_elements_text` unnests the array so each element can be grouped
 * — there's no Prisma API for this, hence the raw query. Column names are
 * hard-coded rather than interpolated so this can never become an injection
 * point.
 */
async function jsonArrayFacet(
  column: "sizes" | "applications",
  category?: string
): Promise<Facet[]> {
  const columnRef = column === "sizes" ? Prisma.sql`"sizes"` : Prisma.sql`"applications"`;
  const categoryClause = category
    ? Prisma.sql`AND p."categoryId" = (SELECT id FROM "Category" WHERE slug = ${category})`
    : Prisma.empty;

  try {
    const rows = await prisma.$queryRaw<{ value: string; count: bigint }[]>(Prisma.sql`
      SELECT elem AS value, COUNT(*) AS count
      FROM "Product" p,
           LATERAL jsonb_array_elements_text(
             CASE WHEN jsonb_typeof(p.${columnRef}) = 'array' THEN p.${columnRef} ELSE '[]'::jsonb END
           ) AS elem
      WHERE p."published" = true AND p."deletedAt" IS NULL ${categoryClause}
      GROUP BY elem
      ORDER BY count DESC, value ASC
      LIMIT 60
    `);
    return rows.map((r) => ({ value: r.value, count: Number(r.count) }));
  } catch {
    return [];
  }
}

/** How many products are published — decides client-side vs server-side browsing. */
export async function countPublishedProducts(): Promise<number> {
  try {
    return await prisma.product.count({ where: { published: true, deletedAt: null } });
  } catch {
    return 0;
  }
}

/** Rebuild a query string with one facet toggled, preserving the rest. */
export function toggleParam(
  current: Record<string, string | string[] | undefined>,
  key: string,
  value: string
): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(current)) {
    if (typeof v === "string" && v && k !== "page") params.set(k, v);
  }
  if (params.get(key) === value) params.delete(key);
  else params.set(key, value);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}
