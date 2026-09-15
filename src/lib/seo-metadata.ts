import type { Metadata } from "next";
import {
  DEFAULT_OG_IMAGE,
  SITE_NAME,
  absoluteUrl,
  crawlDirectivesFor,
} from "@/lib/seo-config";

/**
 * Reusable metadata generators.
 *
 * Nothing here writes metadata for a specific product, brand or category —
 * with 6,000+ products that would be unmaintainable. Each generator takes the
 * real database record and derives a title, description, canonical, Open Graph
 * and Twitter block from it, and every page then passes the result through
 * `applySeo()` so a CMS-authored override still wins.
 *
 * Two rules the descriptions follow:
 *  - they vary on the attributes the record actually has, so a thousand
 *    products do not share one templated sentence;
 *  - they never assert a fact the record does not carry. A missing finish or
 *    size drops out of the sentence rather than being filled with a guess.
 */

/**
 * Title parts joined the same way everywhere: topic | qualifier | Prestige.
 *
 * Returned to callers as an *absolute* title. The root layout defines a
 * `%s — Prestige Tiles & Sanitary` template, and letting it wrap a title that
 * already ends in "| Prestige" produced "… | Prestige — Prestige Tiles &
 * Sanitary" — the repeated-brand stuffing that title rules explicitly forbid.
 */
function title(...parts: (string | null | undefined)[]): string {
  const cleaned = parts
    .map((p) => p?.trim())
    .filter((p): p is string => !!p && p.length > 0);
  // Never "Prestige | Prestige" — drop a qualifier that repeats the site name.
  const deduped = cleaned.filter((p, i) => cleaned.findIndex((q) => q.toLowerCase() === p.toLowerCase()) === i);
  return [...deduped, SITE_NAME].join(" | ");
}

/** Join a clause list into a sentence, dropping anything empty. */
function sentence(parts: (string | null | undefined)[]): string {
  return parts
    .map((p) => p?.trim())
    .filter((p): p is string => !!p && p.length > 0)
    .join(" ");
}

function ogBlock(opts: {
  title: string;
  description: string;
  url: string;
  image?: string | null;
  type?: "website" | "article";
}): Metadata {
  const image = opts.image || DEFAULT_OG_IMAGE;
  return {
    openGraph: {
      title: opts.title,
      description: opts.description,
      url: opts.url,
      siteName: SITE_NAME,
      type: opts.type ?? "website",
      images: [{ url: image }],
    },
    twitter: {
      card: "summary_large_image",
      title: opts.title,
      description: opts.description,
      images: [image],
    },
  };
}

// ————— Products —————

export interface ProductSeoInput {
  name: string;
  slug: string;
  /** Route segment the product lives under, for the canonical path. */
  categorySlug: string;
  /** Human-readable category, e.g. "Faucets". */
  categoryName?: string | null;
  brand?: string | null;
  description?: string | null;
  sku?: string | null;
  finish?: string | null;
  material?: string | null;
  color?: string | null;
  size?: string | null;
  image?: string | null;
}

/**
 * A product's metadata.
 *
 * The description is built from whichever attributes this particular product
 * has, so a faucet and a 1200x2400 slab do not end up with the same sentence.
 */
export function buildProductMetadata(p: ProductSeoInput): Metadata {
  const path = `/products/${p.categorySlug}/${p.slug}`;
  const url = absoluteUrl(path);

  // "Jaquar Kubix Wall Hung WC | Prestige" — the brand only when it is not
  // already the first word of the product name.
  const brandPrefix =
    p.brand && !p.name.toLowerCase().startsWith(p.brand.toLowerCase()) ? `${p.brand} ` : "";
  const pageTitle = title(`${brandPrefix}${p.name}`.trim(), p.categoryName ?? undefined);

  const attributes = [
    p.finish ? `${p.finish.toLowerCase()} finish` : null,
    p.color ? `in ${p.color.toLowerCase()}` : null,
    p.size ? `${p.size}` : null,
    p.material ? `${p.material.toLowerCase()}` : null,
  ].filter(Boolean);

  const description =
    p.description?.trim() ||
    sentence([
      `${brandPrefix}${p.name}`.trim() + (p.categoryName ? ` — ${p.categoryName.toLowerCase()}` : "") + ".",
      attributes.length ? `${attributes.join(", ")}.` : null,
      "View specifications, sizes and variants, or see it at full scale in our Mangaluru showrooms.",
    ]);

  return {
    title: { absolute: pageTitle },
    description,
    alternates: { canonical: url },
    ...ogBlock({ title: pageTitle, description, url, image: p.image }),
    ...(p.sku ? { other: { "product:retailer_item_id": p.sku } } : {}),
  };
}

// ————— Brands —————

export interface BrandSeoInput {
  name: string;
  slug: string;
  description?: string | null;
  shortDescription?: string | null;
  productCount?: number;
  /** The categories this brand actually sells in — drives a real description. */
  categoryNames?: string[];
  image?: string | null;
}

export function buildBrandMetadata(b: BrandSeoInput): Metadata {
  const path = `/brands/${b.slug}`;
  const url = absoluteUrl(path);

  // "Jaquar Bathroom Products & Collections" comes from the brand's own
  // categories rather than an assumption about what the brand sells.
  const cats = (b.categoryNames ?? []).filter(Boolean);
  const focus = cats.length
    ? `${cats.slice(0, 3).join(", ")}${cats.length > 3 ? " & more" : ""}`
    : null;

  const pageTitle = title(`${b.name}${focus ? ` ${cats.length > 1 ? "Products" : cats[0]}` : " Products"} & Collections`);

  const description =
    b.shortDescription?.trim() ||
    b.description?.trim() ||
    sentence([
      `Explore ${b.name}${focus ? ` ${focus.toLowerCase()}` : ""} at ${SITE_NAME}.`,
      b.productCount ? `${b.productCount.toLocaleString("en-IN")} products` : null,
      "available to view across our Mangaluru showrooms.",
    ]);

  return {
    title: { absolute: pageTitle },
    description,
    alternates: { canonical: url },
    ...ogBlock({ title: pageTitle, description, url, image: b.image }),
  };
}

export interface BrandCategorySeoInput {
  brandName: string;
  brandSlug: string;
  categoryName: string;
  categorySlug: string;
  /** A short qualifier, e.g. "Premium Bathroom Products". */
  qualifier?: string | null;
  count?: number;
  image?: string | null;
  searchParams?: Record<string, string | string[] | undefined>;
}

/**
 * Brand + category — the pages worth ranking for "jaquar faucets".
 *
 * Filtered views of the same page canonicalise back to it and drop out of the
 * index; see `crawlDirectivesFor`.
 */
export function buildBrandCategoryMetadata(i: BrandCategorySeoInput): Metadata {
  const path = `/brands/${i.brandSlug}/${i.categorySlug}`;
  const { canonical, robots } = crawlDirectivesFor(path, i.searchParams ?? {});

  const pageTitle = title(`${i.brandName} ${i.categoryName}`, i.qualifier ?? undefined);
  const description = sentence([
    `Browse ${i.brandName} ${i.categoryName.toLowerCase()} at ${SITE_NAME}${
      i.count ? ` — ${i.count.toLocaleString("en-IN")} products` : ""
    }.`,
    "Compare sizes, finishes and collections, or see them at full scale in our Mangaluru showrooms.",
  ]);

  return {
    title: { absolute: pageTitle },
    description,
    robots,
    alternates: { canonical },
    ...ogBlock({ title: pageTitle, description, url: canonical, image: i.image }),
  };
}

// ————— Categories —————

export interface CategorySeoInput {
  name: string;
  /** Full route path, e.g. "/tiles/gvt" or "/bathware". */
  path: string;
  qualifier?: string | null;
  description?: string | null;
  count?: number;
  image?: string | null;
  searchParams?: Record<string, string | string[] | undefined>;
}

export function buildCategoryMetadata(c: CategorySeoInput): Metadata {
  const { canonical, robots } = crawlDirectivesFor(c.path, c.searchParams ?? {});

  const pageTitle = title(c.name, c.qualifier ?? undefined);
  const description =
    c.description?.trim() ||
    sentence([
      `${c.name} at ${SITE_NAME}${c.count ? ` — ${c.count.toLocaleString("en-IN")} products` : ""}`,
      "across every brand we carry.",
      "Compare sizes, finishes and collections, or view them at full scale in our Mangaluru showrooms.",
    ]);

  return {
    title: { absolute: pageTitle },
    description,
    robots,
    alternates: { canonical },
    ...ogBlock({ title: pageTitle, description, url: canonical, image: c.image }),
  };
}

export interface CollectionSeoInput {
  name: string;
  slug: string;
  brandName?: string | null;
  description?: string | null;
  count?: number;
  image?: string | null;
}

export function buildCollectionMetadata(c: CollectionSeoInput): Metadata {
  const path = `/collections/${c.slug}`;
  const url = absoluteUrl(path);

  const pageTitle = title(
    c.brandName ? `${c.brandName} ${c.name}` : c.name,
    "Collection"
  );
  const description =
    c.description?.trim() ||
    sentence([
      `The ${c.brandName ? `${c.brandName} ` : ""}${c.name} collection at ${SITE_NAME}`,
      c.count ? `— ${c.count.toLocaleString("en-IN")} products` : null,
      "with full specifications and sizes.",
    ]);

  return {
    title: { absolute: pageTitle },
    description,
    alternates: { canonical: url },
    ...ogBlock({ title: pageTitle, description, url, image: c.image }),
  };
}
