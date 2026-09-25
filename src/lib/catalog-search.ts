import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { toCatalogProduct, PRODUCT_INCLUDE, PUBLIC_PRODUCT_WHERE, PUBLIC_PRODUCT_SQL } from "@/lib/products";
import { getCategorySubtreeIds } from "@/lib/category-tree";
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
  /**
   * A section slug (e.g. "bathware") for umbrella pages that span the whole
   * section. Kept separate from `category` so a page can pin its section while
   * the visitor switches categories inside it; both now scope to the full
   * subtree, so the difference is intent, not reach.
   */
  categoryGroup?: string;
  brand?: string;
  collection?: string;
  finish?: string;
  material?: string;
  color?: string;
  size?: string;
  surface?: string;
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
    surfaces: Facet[];
    applications: Facet[];
  };
}

export const DEFAULT_PER_PAGE = 24;

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
    surface: one("surface"),
    application: one("room") ?? one("application"),
    page: Number.isFinite(page) && page > 0 ? Math.floor(page) : 1,
    sort: sort === "newest" || sort === "name" ? sort : "featured",
  };
}

/**
 * `categoryIds` is the already-resolved subtree scope (see `resolveScope`).
 * It is passed in rather than looked up here so the search, the count and the
 * facets all filter on exactly the same set of categories.
 */
function buildWhere(f: CatalogFilters, categoryIds?: string[]): Prisma.ProductWhereInput {
  const and: Prisma.ProductWhereInput[] = [PUBLIC_PRODUCT_WHERE];

  // A named category that resolved to nothing must match nothing — falling
  // through to "no category filter" would answer /bathware/nonsense with the
  // whole catalogue.
  if (f.category || f.categoryGroup) {
    and.push({ categoryId: { in: categoryIds ?? [] } });
  }
  if (f.brand) and.push({ brand: { name: { equals: f.brand, mode: "insensitive" } } });
  if (f.collection) and.push({ collection: { equals: f.collection, mode: "insensitive" } });
  if (f.finish) and.push({ finish: { equals: f.finish, mode: "insensitive" } });
  if (f.material) and.push({ material: { equals: f.material, mode: "insensitive" } });
  if (f.color) and.push({ color: { equals: f.color, mode: "insensitive" } });
  if (f.surface) and.push({ surface: { equals: f.surface, mode: "insensitive" } });

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
        { sku: { contains: f.q, mode: "insensitive" } },
        { finish: { contains: f.q, mode: "insensitive" } },
        { material: { contains: f.q, mode: "insensitive" } },
        { color: { contains: f.q, mode: "insensitive" } },
        { brand: { name: { contains: f.q, mode: "insensitive" } } },
        { category: { name: { contains: f.q, mode: "insensitive" } } },
        { collectionRelation: { name: { contains: f.q, mode: "insensitive" } } },
        // A customer quoting a variant's article code should land on its
        // product — the variant is what is printed on the box, not the parent.
        { variants: { some: { sku: { contains: f.q, mode: "insensitive" } } } },
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

  try {
    // Resolved once and shared: the listing, the total and the facets must
    // agree, and each resolution is a recursive walk of the category tree.
    const scope = await resolveScope({
      category: filters.category,
      categoryGroup: filters.categoryGroup,
      brand: filters.brand,
    });
    const where = buildWhere(filters, scope.categoryIds);

    const [rows, total, facets] = await Promise.all([
      prisma.product.findMany({
        where,
        include: PRODUCT_INCLUDE,
        orderBy: buildOrder(filters.sort),
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.product.count({ where }),
      // Facets deliberately reflect the *unfiltered interactive* scope — the
      // structural "where am I" constraints (category/categoryGroup/brand)
      // still apply, so a brand page's chips only ever show that brand's own
      // values, but the interactive chips (finish/colour/size/q/...) are
      // dropped, so a visitor can always see — and switch to — the other
      // options rather than being funnelled into a dead end by their own
      // first click.
      computeFacets(scope),
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
      facets: { brands: [], collections: [], finishes: [], materials: [], colors: [], sizes: [], surfaces: [], applications: [] },
    };
  }
}

interface ResolvedScope {
  /** Undefined when neither a category nor a group was asked for. */
  categoryIds?: string[];
  brandId?: string;
}

/**
 * Resolves the structural scope (category/categoryGroup/brand) to concrete ids
 * once, shared by the Prisma `where` and the raw-SQL facets below.
 *
 * Both category inputs expand to their full subtree, so a page pinned to
 * "Faucets" covers everything filed under Faucets' children too.
 */
async function resolveScope(scope: {
  category?: string;
  categoryGroup?: string;
  brand?: string;
}): Promise<ResolvedScope> {
  const categoryIds: string[] = [];

  if (scope.category) categoryIds.push(...(await getCategorySubtreeIds(scope.category)));
  if (scope.categoryGroup) categoryIds.push(...(await getCategorySubtreeIds(scope.categoryGroup)));

  let brandId: string | undefined;
  if (scope.brand) {
    const b = await prisma.brand.findFirst({ where: { name: { equals: scope.brand, mode: "insensitive" } }, select: { id: true } });
    brandId = b?.id;
  }

  return {
    // An asked-for scope that resolved to nothing stays an empty array — an
    // empty `in` matches no rows, which is the correct answer for an unknown
    // category. `undefined` means "no category scope requested" instead.
    categoryIds: scope.category || scope.categoryGroup ? [...new Set(categoryIds)] : undefined,
    brandId,
  };
}

async function computeFacets({ categoryIds, brandId }: ResolvedScope): Promise<CatalogSearchResult["facets"]> {
  const where: Prisma.ProductWhereInput = {
    ...PUBLIC_PRODUCT_WHERE,
    ...(categoryIds ? { categoryId: { in: categoryIds } } : {}),
    ...(brandId ? { brandId } : {}),
  };

  const [byBrand, byCollection, byFinish, byMaterial, byColor, bySurface, sizes, applications] = await Promise.all([
    prisma.product.groupBy({ by: ["brandId"], where, _count: { _all: true } }),
    prisma.product.groupBy({ by: ["collection"], where, _count: { _all: true } }),
    prisma.product.groupBy({ by: ["finish"], where, _count: { _all: true } }),
    prisma.product.groupBy({ by: ["material"], where, _count: { _all: true } }),
    prisma.product.groupBy({ by: ["color"], where, _count: { _all: true } }),
    prisma.product.groupBy({ by: ["surface"], where, _count: { _all: true } }),
    jsonArrayFacet("sizes", { categoryIds, brandId }),
    jsonArrayFacet("applications", { categoryIds, brandId }),
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
    surfaces: clean(bySurface, (r) => r.surface),
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
  scope: { categoryIds?: string[]; brandId?: string }
): Promise<Facet[]> {
  const columnRef = column === "sizes" ? Prisma.sql`"sizes"` : Prisma.sql`"applications"`;
  const clauses = [PUBLIC_PRODUCT_SQL];
  // `Prisma.join` cannot render an empty list, and an unknown category must
  // match nothing rather than everything — so the impossible clause is
  // written out explicitly.
  if (scope.categoryIds?.length === 0) clauses.push(Prisma.sql`false`);
  else if (scope.categoryIds) clauses.push(Prisma.sql`p."categoryId" IN (${Prisma.join(scope.categoryIds)})`);
  if (scope.brandId) clauses.push(Prisma.sql`p."brandId" = ${scope.brandId}`);

  try {
    const rows = await prisma.$queryRaw<{ value: string; count: bigint }[]>(Prisma.sql`
      SELECT elem AS value, COUNT(*) AS count
      FROM "Product" p,
           LATERAL jsonb_array_elements_text(
             CASE WHEN jsonb_typeof(p.${columnRef}) = 'array' THEN p.${columnRef} ELSE '[]'::jsonb END
           ) AS elem
      WHERE ${Prisma.join(clauses, " AND ")}
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
    return await prisma.product.count({ where: PUBLIC_PRODUCT_WHERE });
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
