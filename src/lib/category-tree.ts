import { cache } from "react";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Category-subtree resolution.
 *
 * The catalogue tree is three levels deep — `bathware > wellness >
 * spa-systems`, `tiles > gvt > 600x1200` — and 4,083 of the fixture's 5,504
 * published products hang off the third level. Every scoping rule in the app
 * used to look one level down (`{ parent: { slug } }`) or match a slug
 * exactly, which meant:
 *
 *  - `/bathware` listed 648 of its 2,626 products;
 *  - `/bathware/faucets` listed the 123 filed directly on "Faucets" and none
 *    of the 322 under its children;
 *  - the category counts advertised those same short numbers.
 *
 * Products that exist but cannot be reached by browsing are invisible to a
 * crawler as well as to a customer, so scoping is resolved here once, against
 * the whole subtree, and shared by the search, the facets and the counts.
 *
 * A recursive CTE rather than N queries: the tree is small but this runs on
 * every catalogue request, and the depth is a property of the data, not
 * something to hardcode a second time.
 *
 * Neither function swallows a database error. That distinction is not
 * academic: their callers turn an empty result into `notFound()`, so while an
 * earlier version caught and returned `[]`, one build that briefly exhausted
 * the connection pool baked a permanent 404 into 92 category pages that exist
 * and hold products. An infrastructure failure has to surface as one.
 */

/**
 * Every category id at or below `slug`, including the category itself.
 *
 * Returns `[]` for an unknown slug — callers treat that as "no such scope"
 * rather than "no filter", so a typo'd category never silently widens a page
 * to the entire catalogue.
 */
export const getCategorySubtreeIds = cache(async (slug: string): Promise<string[]> => {
  const rows = await prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
    WITH RECURSIVE subtree AS (
      SELECT c.id, 1 AS depth
        FROM "Category" c
       WHERE c.slug = ${slug} AND c."deletedAt" IS NULL
      UNION ALL
      SELECT c.id, s.depth + 1
        FROM "Category" c
        JOIN subtree s ON c."parentId" = s.id
       WHERE c."deletedAt" IS NULL AND s.depth < 8
    )
    SELECT id FROM subtree
  `);
  return rows.map((r) => r.id);
});

/**
 * Published product counts for a set of categories, each counting its whole
 * subtree.
 *
 * One query for all of them — a per-category count would be N round trips on
 * a page that already renders the full category list.
 */
export const getSubtreeProductCounts = cache(
  async (categoryIds: readonly string[], brandId?: string): Promise<Map<string, number>> => {
    if (categoryIds.length === 0) return new Map();

    // Brand pages count the same subtree, narrowed to one brand — so the
    // number on a category chip matches the number of products the page
    // behind it lists.
    const brandClause = brandId ? Prisma.sql`AND p."brandId" = ${brandId}` : Prisma.empty;

    const rows = await prisma.$queryRaw<{ root: string; count: bigint }[]>(Prisma.sql`
      WITH RECURSIVE subtree AS (
        SELECT c.id, c.id AS root, 1 AS depth
          FROM "Category" c
         WHERE c.id IN (${Prisma.join([...categoryIds])}) AND c."deletedAt" IS NULL
        UNION ALL
        SELECT c.id, s.root, s.depth + 1
          FROM "Category" c
          JOIN subtree s ON c."parentId" = s.id
         WHERE c."deletedAt" IS NULL AND s.depth < 8
      )
      SELECT s.root AS root, COUNT(p.id) AS count
        FROM subtree s
        LEFT JOIN "Product" p
          ON p."categoryId" = s.id AND p.published = true AND p."deletedAt" IS NULL ${brandClause}
       GROUP BY s.root
    `);
    return new Map(rows.map((r) => [r.root, Number(r.count)]));
  }
);
