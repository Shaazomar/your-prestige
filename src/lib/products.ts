import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { products as fallbackProducts, type CatalogProduct } from "@/lib/catalog";
import { toApplications } from "@/lib/applications";
import type { Prisma } from "@prisma/client";

/**
 * Reads the public catalogue out of PostgreSQL and shapes it into the
 * `CatalogProduct` the catalog components already consume.
 *
 * Two things make this safe to drop in front of a live site:
 *
 * 1. **Every getter falls back to `@/lib/catalog`.** The Prisma model has
 *    almost every field nullable, while `CatalogProduct` has almost none —
 *    `toCatalogProduct` closes that gap with a real fallback per field, so a
 *    half-filled admin row still renders a complete card. And if the database
 *    is unreachable or empty, the hardcoded catalogue renders instead of an
 *    error. This mirrors how `getBusiness()` falls back to `site-config`.
 *
 * 2. **Applications are re-normalised on read** (`toApplications`), so a value
 *    that predates the normaliser — or was typed by hand — can never reach
 *    `ApplicationBadge`'s icon map as an unknown key.
 */

const PRODUCT_INCLUDE = {
  category: { select: { slug: true, name: true } },
  brand: { select: { name: true } },
} satisfies Prisma.ProductInclude;

type ProductRow = Prisma.ProductGetPayload<{ include: typeof PRODUCT_INCLUDE }>;

/**
 * `CatalogExplorer` recomputes its filter facets client-side from the array it
 * receives, so the whole set has to be shipped to the browser. That's fine for
 * a curated catalogue and stops being fine somewhere in the low thousands —
 * Phase 7's `CatalogBrowser` handles the DB-side filtering past this point.
 */
export const CATALOG_CLIENT_LIMIT = 300;

/** Local asset, so a product with no imagery never renders a broken tile. */
const FALLBACK_IMAGE = "/brand/og-image.png";

const CATEGORY_SLUGS: CatalogProduct["category"][] = ["tiles", "sanitary", "designer-picks"];
const TAGS: NonNullable<CatalogProduct["tag"]>[] = [
  "Bestseller", "New Arrival", "Designer Pick", "Premium", "Limited",
];
const ASPECTS: CatalogProduct["aspect"][] = ["portrait", "square", "landscape"];

const arr = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.length > 0) : [];

/** Stable per-slug integer — lets us vary presentation without storing it. */
function slugHash(slug: string): number {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function resolveCategory(row: ProductRow): CatalogProduct["category"] {
  const slug = row.category?.slug as CatalogProduct["category"] | undefined;
  if (slug && CATEGORY_SLUGS.includes(slug)) return slug;
  if (row.designerPick) return "designer-picks";
  // Nested categories ("bathroom-tiles") still belong to a top-level bucket.
  if (slug && /sanitary|bath|faucet|shower|basin/.test(slug)) return "sanitary";
  return "tiles";
}

/** Map one Prisma row onto the fully-populated shape the components expect. */
export function toCatalogProduct(row: ProductRow): CatalogProduct {
  const brand = row.brand?.name?.trim() || "Prestige";
  const collection = row.collection?.trim() || `${brand} Collection`;
  const images = arr(row.images);
  const sizes = arr(row.sizes);
  const applications = toApplications(row.applications);

  const lifestyleImage = row.lifestyleImage || images[0] || row.textureImage || FALLBACK_IMAGE;
  const textureImage = row.textureImage || images[1] || images[0] || lifestyleImage;
  const gallery = images.filter((i) => i !== lifestyleImage && i !== textureImage);

  const finish = row.finish?.trim() || row.surface?.trim() || row.material?.trim() || "Standard";
  const color = row.color?.trim() || "Natural";

  const tag = row.tag && (TAGS as string[]).includes(row.tag)
    ? (row.tag as NonNullable<CatalogProduct["tag"]>)
    : undefined;

  const aspect = row.aspect && (ASPECTS as string[]).includes(row.aspect)
    ? (row.aspect as CatalogProduct["aspect"])
    // No stored aspect: derive one deterministically so the masonry grid keeps
    // its varied rhythm and doesn't collapse into uniform rows.
    : ASPECTS[slugHash(row.slug) % ASPECTS.length];

  return {
    slug: row.slug,
    name: row.name,
    collection,
    brand,
    category: resolveCategory(row),
    finish,
    thickness: row.thickness?.trim() || "—",
    sizes,
    applications,
    color,
    texture: row.texture?.trim() || row.material?.trim() || finish,
    tag,
    description: row.description?.trim() || describe({ name: row.name, brand, collection, finish, color, sizes }),
    lifestyleImage,
    textureImage,
    gallery,
    aspect,
    featured: row.featured,
  };
}

/** Last-resort description so a card is never blank. Real copy comes from enrichment. */
function describe(p: {
  name: string; brand: string; collection: string; finish: string; color: string; sizes: string[];
}): string {
  const size = p.sizes.length ? ` Available in ${p.sizes.join(", ")}.` : "";
  return `${p.name} from ${p.brand}'s ${p.collection} — a ${p.finish.toLowerCase()} surface in ${p.color.toLowerCase()}.${size}`;
}

/** The published catalogue, most prominent first. */
export const getCatalogProducts = cache(
  async (opts?: { category?: CatalogProduct["category"]; limit?: number }): Promise<CatalogProduct[]> => {
    try {
      const rows = await prisma.product.findMany({
        where: { published: true, deletedAt: null },
        include: PRODUCT_INCLUDE,
        orderBy: [{ featured: "desc" }, { viewCount: "desc" }, { createdAt: "desc" }],
        take: opts?.limit ?? CATALOG_CLIENT_LIMIT,
      });
      if (rows.length === 0) return filterCategory(fallbackProducts, opts?.category);
      return filterCategory(rows.map(toCatalogProduct), opts?.category);
    } catch {
      return filterCategory(fallbackProducts, opts?.category);
    }
  }
);

export const getCatalogProduct = cache(async (slug: string): Promise<CatalogProduct | null> => {
  try {
    const row = await prisma.product.findFirst({
      where: { slug, published: true, deletedAt: null },
      include: PRODUCT_INCLUDE,
    });
    if (row) return toCatalogProduct(row);
  } catch {
    // fall through to the bundled catalogue
  }
  return fallbackProducts.find((p) => p.slug === slug) ?? null;
});

/**
 * Related products — same scoring the bundled `getRelated()` used (category and
 * collection worth 2, brand 1), but resolved against the database so a
 * thousand-product catalogue doesn't have to be loaded to find three neighbours.
 */
export const getRelatedProducts = cache(
  async (product: CatalogProduct, count = 3): Promise<CatalogProduct[]> => {
    try {
      const rows = await prisma.product.findMany({
        where: {
          published: true,
          deletedAt: null,
          slug: { not: product.slug },
          OR: [
            { collection: product.collection },
            { brand: { name: product.brand } },
            { category: { slug: product.category } },
          ],
        },
        include: PRODUCT_INCLUDE,
        take: 40,
      });
      if (rows.length === 0) throw new Error("no matches");

      const scored = rows
        .map(toCatalogProduct)
        .map((p) => ({
          p,
          score:
            (p.category === product.category ? 2 : 0) +
            (p.collection === product.collection ? 2 : 0) +
            (p.brand === product.brand ? 1 : 0),
        }))
        .sort((a, b) => b.score - a.score);

      return scored.slice(0, count).map((s) => s.p);
    } catch {
      return fallbackProducts
        .filter((p) => p.slug !== product.slug)
        .sort((a, b) => {
          const score = (p: CatalogProduct) =>
            (p.category === product.category ? 2 : 0) +
            (p.collection === product.collection ? 2 : 0) +
            (p.brand === product.brand ? 1 : 0);
          return score(b) - score(a);
        })
        .slice(0, count);
    }
  }
);

/** Slugs for `generateStaticParams` — capped, and never throwing at build time. */
export async function getCatalogParams(limit = 100): Promise<{ category: string; slug: string }[]> {
  try {
    const rows = await prisma.product.findMany({
      where: { published: true, deletedAt: null },
      include: PRODUCT_INCLUDE,
      orderBy: [{ featured: "desc" }, { viewCount: "desc" }],
      take: limit,
    });
    if (rows.length === 0) {
      return fallbackProducts.map((p) => ({ category: p.category, slug: p.slug }));
    }
    return rows.map((r) => ({ category: resolveCategory(r), slug: r.slug }));
  } catch {
    // A build with no database still needs to succeed; the long tail renders
    // on demand because `dynamicParams` defaults to true.
    return [];
  }
}

function filterCategory(list: CatalogProduct[], category?: CatalogProduct["category"]) {
  return category ? list.filter((p) => p.category === category) : list;
}
