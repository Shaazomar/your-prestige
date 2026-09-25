import { NextResponse, type NextRequest } from "next/server";
import { searchCatalog, type CatalogFilters } from "@/lib/catalog-search";

/**
 * Public product listing API.
 *
 * This used to filter the small hardcoded fallback array from `lib/catalog`
 * — a dozen or so demo products — and never touched the database at all, so
 * any caller of this endpoint (nothing in this app calls it today, but it's
 * a public, unauthenticated route, so an external integration might) got a
 * handful of fixture products no matter what was actually published. Rebuilt
 * on `searchCatalog`, the same server-side, paginated query every catalogue
 * page uses — see `PUBLIC_PRODUCT_WHERE` in `lib/products.ts` for the one
 * rule that decides what's visible.
 *
 * `inStock` is intentionally not wired to anything: this is a showcase
 * catalogue, and stock availability must never remove a product from public
 * listings.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "50", 10) || 50, 1), 200);
  const page = Math.max(parseInt(searchParams.get("page") || "1", 10) || 1, 1);

  const filters: CatalogFilters = {
    q: searchParams.get("query")?.trim() || undefined,
    category: searchParams.get("category")?.trim() || undefined,
    collection: searchParams.get("collection")?.trim() || undefined,
    finish: searchParams.get("finish")?.trim() || undefined,
    color: searchParams.get("color")?.trim() || undefined,
    application: searchParams.get("application")?.trim() || undefined,
    page,
    perPage: limit,
  };

  const result = await searchCatalog(filters);

  return NextResponse.json(
    {
      success: true,
      total: result.total,
      page: result.page,
      limit: result.perPage,
      totalPages: result.pageCount,
      data: result.products,
    },
    { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } }
  );
}
