import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { toCatalogProduct, PRODUCT_INCLUDE, PUBLIC_PRODUCT_WHERE } from "@/lib/products";

/**
 * Grouped search-as-you-type suggestions: brands, products and categories in
 * one round trip, each a small indexed lookup — never the full catalogue.
 * Backs the debounced `GlobalSearchModal`.
 */

export interface SuggestBrand {
  slug: string;
  name: string;
  count: number;
}

export interface SuggestCategory {
  slug: string;
  name: string;
  href: string;
}

export interface SuggestResponse {
  brands: SuggestBrand[];
  products: ReturnType<typeof toCatalogProduct>[];
  categories: SuggestCategory[];
}

/**
 * A category only ever resolves to a real, indexable page — never a dead link.
 *
 * Which section a category belongs to is a question about its whole ancestry:
 * the tree is three deep, so checking the immediate parent alone dropped every
 * third-level category (and, oddly, every tile category below the root) out of
 * the suggestions entirely.
 */
function categoryHref(c: { slug: string; ancestors: string[] }): string | null {
  if (c.slug === "tiles") return "/tiles";
  if (c.slug === "bathware") return "/bathware";
  if (c.ancestors.includes("tiles")) return `/tiles/${c.slug}`;
  if (c.ancestors.includes("bathware")) return `/bathware/${c.slug}`;
  return null;
}

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();

  try {
    if (!q) {
      const [brands, products] = await Promise.all([
        prisma.brand.findMany({
          where: { published: true, deletedAt: null, products: { some: PUBLIC_PRODUCT_WHERE } },
          select: { slug: true, name: true, _count: { select: { products: { where: PUBLIC_PRODUCT_WHERE } } } },
          orderBy: { products: { _count: "desc" } },
          take: 5,
        }),
        prisma.product.findMany({
          where: { ...PUBLIC_PRODUCT_WHERE, featured: true },
          include: PRODUCT_INCLUDE,
          orderBy: { viewCount: "desc" },
          take: 4,
        }),
      ]);

      const body: SuggestResponse = {
        brands: brands.map((b) => ({ slug: b.slug, name: b.name, count: b._count.products })),
        products: products.map(toCatalogProduct),
        categories: [],
      };
      return NextResponse.json(body, { headers: { "Cache-Control": "public, max-age=60" } });
    }

    const [brands, products, categories] = await Promise.all([
      prisma.brand.findMany({
        where: {
          published: true,
          deletedAt: null,
          name: { contains: q, mode: "insensitive" },
          products: { some: PUBLIC_PRODUCT_WHERE },
        },
        select: { slug: true, name: true, _count: { select: { products: { where: PUBLIC_PRODUCT_WHERE } } } },
        orderBy: { products: { _count: "desc" } },
        take: 4,
      }),
      prisma.product.findMany({
        where: {
          ...PUBLIC_PRODUCT_WHERE,
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { productCode: { contains: q, mode: "insensitive" } },
            { sku: { contains: q, mode: "insensitive" } },
            { collection: { contains: q, mode: "insensitive" } },
          ],
        },
        include: PRODUCT_INCLUDE,
        orderBy: [{ featured: "desc" }, { viewCount: "desc" }],
        take: 6,
      }),
      prisma.category.findMany({
        where: {
          published: true,
          deletedAt: null,
          name: { contains: q, mode: "insensitive" },
          products: { some: PUBLIC_PRODUCT_WHERE },
        },
        select: {
          slug: true,
          name: true,
          parent: { select: { slug: true, parent: { select: { slug: true, parent: { select: { slug: true } } } } } },
        },
        take: 6,
      }),
    ]);

    const body: SuggestResponse = {
      brands: brands.map((b) => ({ slug: b.slug, name: b.name, count: b._count.products })),
      products: products.map(toCatalogProduct),
      categories: categories
        .map((c) => {
          const ancestors: string[] = [];
          let node = c.parent as { slug: string; parent?: unknown } | null | undefined;
          while (node && ancestors.length < 8) {
            ancestors.push(node.slug);
            node = node.parent as { slug: string; parent?: unknown } | null | undefined;
          }
          const href = categoryHref({ slug: c.slug, ancestors });
          return href ? { slug: c.slug, name: c.name, href } : null;
        })
        .filter((c): c is SuggestCategory => c !== null)
        .slice(0, 4),
    };

    return NextResponse.json(body, { headers: { "Cache-Control": "public, max-age=30" } });
  } catch {
    const empty: SuggestResponse = { brands: [], products: [], categories: [] };
    return NextResponse.json(empty);
  }
}
