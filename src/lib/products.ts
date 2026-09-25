import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { products as fallbackProducts, type CatalogProduct } from "@/lib/catalog";
import { toApplications } from "@/lib/applications";
import { resolveImageRef } from "@/lib/s3-url";
import { Prisma } from "@prisma/client";

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

/**
 * The catalogue tree is three levels deep (bathware > wellness > spa-systems),
 * so a product's section can only be decided by walking its *whole* ancestry.
 * Selecting a single `parent` classified every grandchild as a tile — see
 * `resolveCategory`. Four levels of `parent` cover the current tree with a
 * level to spare; `categoryTrail` simply stops at whatever depth it is given.
 */
const CATEGORY_SELECT = {
  slug: true,
  name: true,
  parent: {
    select: {
      slug: true,
      name: true,
      parent: {
        select: {
          slug: true,
          name: true,
          parent: { select: { slug: true, name: true } },
        },
      },
    },
  },
} satisfies Prisma.CategorySelect;

/**
 * Exported because `toCatalogProduct` is only correct for a row fetched this
 * way — a shallower `category` select silently changes which section a product
 * resolves to. Any query whose rows reach `toCatalogProduct` must use it.
 */
export const PRODUCT_INCLUDE = {
  category: { select: CATEGORY_SELECT },
  brand: { select: { name: true } },
} satisfies Prisma.ProductInclude;

type ProductRow = Prisma.ProductGetPayload<{ include: typeof PRODUCT_INCLUDE }>;

/**
 * The one predicate that decides whether a product is visible to a website
 * visitor. Every public catalogue query — listing, search, facets, sitemap,
 * related products, sitewide search-suggest, sitemap, SEO audit counts — must
 * filter through this, and nothing else.
 *
 * Deliberately narrow: `published` and `status` are the only two columns that
 * can remove a product from the site, and both require an explicit admin
 * action. Missing image, zero stock, no brand, no collection, no category, no
 * featured flag — none of those hide a product. `status` defaults to
 * `"ACTIVE"` and is a plain string column that already exists on the shared
 * `Product` table (see the datasource note at the top of schema.prisma) —
 * `"DRAFT"` and `"ARCHIVED"` are the two explicit ways an admin can pull a
 * product from public view (the CMS calls these "Draft" and "Hidden"; see
 * `PRODUCT_VISIBILITY_LABEL`). `notIn` rather than `equals("ACTIVE")` on
 * purpose: an unrecognised future status value defaults to *visible*, the
 * same "explicit-only hiding" rule as everything else here.
 */
export const PUBLIC_PRODUCT_WHERE = {
  deletedAt: null,
  published: true,
  status: { notIn: ["DRAFT", "ARCHIVED"] },
} satisfies Prisma.ProductWhereInput;

/** Same predicate, for the raw-SQL queries that can't take a Prisma `where` object. */
export const PUBLIC_PRODUCT_SQL = Prisma.sql`p."deletedAt" IS NULL AND p."published" = true AND p."status" NOT IN ('DRAFT', 'ARCHIVED')`;

/** The three states a product's `status` column can hold, and their CMS labels. */
export const PRODUCT_VISIBILITY_LABEL: Record<string, string> = {
  ACTIVE: "Published",
  DRAFT: "Draft",
  ARCHIVED: "Hidden",
};

/**
 * `CatalogExplorer` recomputes its filter facets client-side from the array it
 * receives, so the whole set has to be shipped to the browser. That's fine for
 * a curated catalogue and stops being fine somewhere in the low thousands —
 * Phase 7's `CatalogBrowser` handles the DB-side filtering past this point.
 */
export const CATALOG_CLIENT_LIMIT = 300;

/**
 * Local asset, so a product with no imagery never renders a broken tile, and
 * `CatalogProduct.lifestyleImage` can stay a required string for the call
 * sites that hand it straight to `next/image` or to OpenGraph metadata.
 *
 * On visual surfaces this exact value is recognised by `SafeImage`, which
 * swaps in its designed "photography coming soon" swatch — showing the brand's
 * social banner in a product tile reads as a broken listing.
 */
export const FALLBACK_IMAGE = "/brand/og-image.png";

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

/** One node of the selected category chain, at any depth. */
interface CategoryNode {
  slug: string;
  name: string;
  parent?: CategoryNode | null;
}

/**
 * A product's categories from most specific to the section root, e.g.
 * `[spa-systems, wellness, bathware]`.
 */
export function categoryTrail(row: {
  category?: CategoryNode | null;
}): { slug: string; name: string }[] {
  const trail: { slug: string; name: string }[] = [];
  let node: CategoryNode | null | undefined = row.category;
  // The select is finite, so this terminates; the guard is only against a
  // cycle accidentally introduced in the category table.
  while (node && trail.length < 8) {
    trail.push({ slug: node.slug, name: node.name });
    node = node.parent;
  }
  return trail;
}

/**
 * Which of the three public sections a product belongs to.
 *
 * This reads the whole ancestry rather than the product's own category and its
 * immediate parent. The taxonomy is three deep — `bathware > wellness >
 * spa-systems` — so the old single-parent check saw `wellness`, not
 * `bathware`, and dropped 832 of the fixture's 2,626 bathware products into
 * "tiles". That was not only a wrong breadcrumb and a wrong canonical bucket:
 * the product page gates its vitrified-tile packaging figures and material
 * copy on this value, so a spa system was being described as a fired slab with
 * a water absorption figure.
 */
export function resolveCategory(row: {
  designerPick?: boolean | null;
  category?: CategoryNode | null;
}): CatalogProduct["category"] {
  if (row.designerPick) return "designer-picks";

  const trail = categoryTrail(row).map((c) => c.slug);
  if (trail.includes("bathware") || trail.includes("sanitary")) return "sanitary";
  if (trail.includes("tiles")) return "tiles";

  // A category tree that doesn't lead to either known root. This used to
  // fall straight through to "tiles" unconditionally — meaning a category
  // added later through the CMS that isn't a tiles/bathware descendant (a
  // "Kitchen" top-level family, say) would have every one of its products
  // silently filed as tiles: wrong breadcrumb, wrong canonical URL, wrong
  // section — with nothing to indicate it had happened. The real root's own
  // slug is returned instead, so the product carries its real section
  // through the type system even before that section has a page of its own
  // (site routing for a genuinely new top-level family is a separate,
  // deliberate addition — see the category audit report).
  if (trail.length > 0) return trail[trail.length - 1];

  // No category assigned at all. There is no ancestry to reason from, so
  // this can't be resolved correctly — "tiles" is kept only as the URL
  // bucket these products already had before this fix, to avoid moving a
  // published, possibly-indexed URL out from under a change nobody asked
  // for. `needsReview`/`reviewReason` and the "Products Needing Category
  // Review" admin view are the real fix for these — see the category
  // audit report.
  return "tiles";
}

/** Map one Prisma row onto the fully-populated shape the components expect. */
export function toCatalogProduct(row: ProductRow): CatalogProduct {
  const brand = row.brand?.name?.trim() || "Prestige";
  const collection = row.collection?.trim() || `${brand} Collection`;
  const images = arr(row.images);
  const sizes = arr(row.sizes);
  const applications = toApplications(row.applications);

  // `image_key` / `thumbnail_key` hold S3 object keys written by the depot's
  // master import. They were never read, so a product whose only photography
  // arrived that way fell straight through to FALLBACK_IMAGE and rendered the
  // brand's OG banner in place of the tile.
  const keyImage = resolveImageRef(row.image_key);
  const keyThumb = resolveImageRef(row.thumbnail_key);

  const lifestyleImage =
    resolveImageRef(row.lifestyleImage) ||
    resolveImageRef(images[0]) ||
    keyImage ||
    keyThumb ||
    resolveImageRef(row.textureImage) ||
    FALLBACK_IMAGE;

  const textureImage =
    resolveImageRef(row.textureImage) ||
    resolveImageRef(images[1]) ||
    resolveImageRef(images[0]) ||
    keyThumb ||
    keyImage ||
    lifestyleImage;

  const gallery = images
    .map((i) => resolveImageRef(i))
    .filter((i): i is string => !!i && i !== lifestyleImage && i !== textureImage);

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
    sku: row.sku || row.productCode || undefined,
    packing: row.packing?.trim() || undefined,
    coverage: row.coverage?.trim() || undefined,
    weight: row.weight?.trim() || undefined,
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
        where: PUBLIC_PRODUCT_WHERE,
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
      where: { slug, ...PUBLIC_PRODUCT_WHERE },
      include: PRODUCT_INCLUDE,
    });
    if (row) return toCatalogProduct(row);
  } catch {
    // fall through to the bundled catalogue
  }
  return fallbackProducts.find((p) => p.slug === slug) ?? null;
});

/**
 * Related products.
 *
 * `product.category` is the section-root *bucket* ("tiles" / "sanitary"),
 * not a real `Category.slug` — comparing it against `category.slug` in a
 * Prisma `where` used to be silently dead for every bathware product (the
 * real root slug is "bathware", not "sanitary"), so the candidate pool
 * collapsed to "same collection OR same brand" with no category constraint
 * at all: a tap could be recommended under a tile purely for sharing a
 * brand. The candidate pool is now built from the anchor's *real* category
 * ancestry (looked up fresh, since `CatalogProduct` doesn't carry a
 * category id) — exact subcategory, then section root — with brand only
 * ever acting as a scoring bonus among candidates already qualified by
 * category or collection, never as a standalone reason to appear.
 */
export const getRelatedProducts = cache(
  async (product: CatalogProduct, count = 3): Promise<CatalogProduct[]> => {
    try {
      const anchor = await prisma.product.findFirst({
        where: { slug: product.slug, ...PUBLIC_PRODUCT_WHERE },
        select: { categoryId: true, category: { select: CATEGORY_SELECT } },
      });

      const trail = anchor ? categoryTrail(anchor).map((c) => c.slug) : [];
      const sectionRoot = trail.length > 0 ? trail[trail.length - 1] : undefined;
      const leafCategoryId = anchor?.categoryId ?? undefined;

      const categoryFilters: Prisma.ProductWhereInput[] = [];
      if (leafCategoryId) categoryFilters.push({ categoryId: leafCategoryId });
      if (sectionRoot) {
        categoryFilters.push(
          { category: { slug: sectionRoot } },
          { category: { parent: { slug: sectionRoot } } },
          { category: { parent: { parent: { slug: sectionRoot } } } }
        );
      }

      // A product with no category ancestry at all has no category signal to
      // scope by — collection/brand is the only fallback left for it, same
      // as before this fix.
      const or: Prisma.ProductWhereInput[] =
        categoryFilters.length > 0
          ? [...categoryFilters, { collection: product.collection }]
          : [{ collection: product.collection }, { brand: { name: product.brand } }];

      const rows = await prisma.product.findMany({
        where: {
          ...PUBLIC_PRODUCT_WHERE,
          slug: { not: product.slug },
          OR: or,
        },
        include: PRODUCT_INCLUDE,
        take: 60,
      });
      if (rows.length === 0) throw new Error("no matches");

      const scored = rows
        .map((r) => {
          const p = toCatalogProduct(r);
          return {
            p,
            score:
              (leafCategoryId && r.categoryId === leafCategoryId ? 4 : 0) +
              (p.category === product.category ? 2 : 0) +
              (p.collection === product.collection ? 2 : 0) +
              (p.brand === product.brand ? 1 : 0),
          };
        })
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
      where: PUBLIC_PRODUCT_WHERE,
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

/**
 * Variants for one product, for the page's ProductGroup structured data.
 *
 * Kept out of `CatalogProduct` deliberately: that shape is shipped to client
 * components for every card in a grid, and variant rows would multiply those
 * payloads for data only the product page uses.
 */
export const getProductVariants = cache(async (slug: string) => {
  try {
    return await prisma.productVariant.findMany({
      where: { active: true, product: { slug, ...PUBLIC_PRODUCT_WHERE } },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: { id: true, sku: true, name: true, size: true, finish: true, color: true },
    });
  } catch {
    return [];
  }
});

/**
 * The product's real category ancestry, most specific first.
 *
 * Queried separately rather than carried on `CatalogProduct`: that shape is
 * serialised to the browser for every card in a grid, and only the product
 * page needs the trail.
 */
export const getProductCategoryTrail = cache(
  async (slug: string): Promise<{ slug: string; name: string }[]> => {
    try {
      const row = await prisma.product.findFirst({
        where: { slug, ...PUBLIC_PRODUCT_WHERE },
        select: { category: { select: CATEGORY_SELECT } },
      });
      return row ? categoryTrail(row) : [];
    } catch {
      return [];
    }
  }
);

/** The product's real category name, for metadata that reads naturally. */
export async function getProductCategoryName(slug: string): Promise<string | null> {
  return (await getProductCategoryTrail(slug))[0]?.name ?? null;
}
