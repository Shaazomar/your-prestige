import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toCatalogProduct } from "@/lib/products";

/**
 * Look up published products by slug.
 *
 * Backs the wishlist and recently-viewed lists: both live in the visitor's
 * localStorage, so the server has no way to know which products to render
 * until the browser says. Public and read-only — it returns nothing an
 * unauthenticated visitor couldn't already see on a product page.
 */

const MAX_SLUGS = 60;

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("slugs") ?? "";
  const slugs = raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => /^[a-z0-9-]{1,120}$/.test(s))
    .slice(0, MAX_SLUGS);

  if (slugs.length === 0) return NextResponse.json({ products: [] });

  try {
    const rows = await prisma.product.findMany({
      where: { slug: { in: slugs }, published: true, deletedAt: null },
      include: { category: { select: { slug: true, name: true } }, brand: { select: { name: true } } },
    });

    // Preserve the order the caller asked for — that's the visitor's own
    // most-recent-first ordering, which a database `in` clause won't respect.
    const bySlug = new Map(rows.map((r) => [r.slug, toCatalogProduct(r)]));
    const products = slugs.map((s) => bySlug.get(s)).filter(Boolean);

    return NextResponse.json(
      { products },
      { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } }
    );
  } catch {
    return NextResponse.json({ products: [] });
  }
}
