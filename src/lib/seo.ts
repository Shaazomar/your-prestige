import { cache } from "react";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { siteUrl } from "@/lib/site-config";

/**
 * Applies CMS-managed SEO overrides to a page's metadata.
 *
 * The `Seo` table and its admin module already existed, and catalogue imports
 * now write a row per published product — but nothing ever read them, so an
 * editor's carefully written title never reached a `<head>`. This is the read
 * side of that loop.
 *
 * Precedence is deliberate: a value an editor typed always wins, and anything
 * they left blank falls through to the page's own computed defaults. That way
 * partially-filled records improve a page rather than blanking it.
 */

/** Absolute, canonical URL for a site-relative path. */
export function absoluteUrl(path: string): string {
  return `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

export interface SeoOverride {
  title: string | null;
  description: string | null;
  keywords: string | null;
  canonical: string | null;
  ogImage: string | null;
  jsonLd: string | null;
  noIndex: boolean;
}

export const getSeoForPath = cache(async (path: string): Promise<SeoOverride | null> => {
  try {
    const row = await prisma.seo.findUnique({ where: { path } });
    if (!row) return null;
    return {
      title: row.title,
      description: row.description,
      keywords: row.keywords,
      canonical: row.canonical,
      ogImage: row.ogImage,
      jsonLd: row.jsonLd,
      noIndex: row.noIndex,
    };
  } catch {
    return null;
  }
});

/** Merge an override over computed defaults, keeping every non-empty default. */
export function applySeo(base: Metadata, override: SeoOverride | null, path: string): Metadata {
  if (!override) return base;

  const title = override.title ? { absolute: override.title } : base.title;
  // `title` may be a string, or { absolute } from a metadata generator — Open
  // Graph needs the plain string either way.
  const titleText =
    typeof title === "string"
      ? title
      : title && typeof title === "object" && "absolute" in title
        ? (title.absolute as string)
        : undefined;
  const description = override.description || base.description;
  const images = override.ogImage
    ? [override.ogImage]
    : (base.openGraph as { images?: unknown } | undefined)?.images;

  return {
    ...base,
    title,
    description,
    ...(override.keywords ? { keywords: override.keywords.split(",").map((k) => k.trim()) } : {}),
    alternates: {
      ...base.alternates,
      canonical: override.canonical || base.alternates?.canonical || `${siteUrl}${path}`,
    },
    openGraph: {
      ...base.openGraph,
      title: titleText,
      description: typeof description === "string" ? description : undefined,
      url: `${siteUrl}${path}`,
      ...(images ? { images: images as string[] } : {}),
    },
    ...(override.noIndex ? { robots: { index: false, follow: true } } : {}),
  };
}

/**
 * Product JSON-LD.
 *
 * `offers` is intentionally omitted. This is a showroom catalogue with no
 * published prices, and emitting an Offer without a real price is exactly the
 * kind of structured data Google flags as misleading. Availability and pricing
 * belong here only once the business actually publishes them.
 */
export function productJsonLd(p: {
  name: string;
  slug: string;
  category: string;
  description: string;
  brand: string;
  images: string[];
  color?: string | null;
  material?: string | null;
  productCode?: string | null;
  sizes?: string[];
}): Record<string, unknown> {
  const additionalProperty = [
    p.sizes?.length ? { "@type": "PropertyValue", name: "Available sizes", value: p.sizes.join(", ") } : null,
    p.material ? { "@type": "PropertyValue", name: "Material", value: p.material } : null,
  ].filter(Boolean);

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.description,
    image: p.images.filter(Boolean),
    brand: { "@type": "Brand", name: p.brand },
    category: p.category,
    url: `${siteUrl}/products/${p.category}/${p.slug}`,
    ...(p.productCode ? { sku: p.productCode, mpn: p.productCode } : {}),
    ...(p.color ? { color: p.color } : {}),
    ...(p.material ? { material: p.material } : {}),
    ...(additionalProperty.length ? { additionalProperty } : {}),
  };
}

/**
 * ProductGroup JSON-LD for a product that has variants.
 *
 * Google's product-variant guidance models one page holding several buyable
 * versions as a ProductGroup whose `hasVariant` entries are Products, with
 * `variesBy` naming the axes that differ. That is exactly our shape: one
 * Product row, N ProductVariant rows, one canonical URL — so variants never
 * become separate indexable pages competing with their parent.
 *
 * `offers` is omitted here for the same reason it is omitted from
 * productJsonLd: this is a showroom catalogue with no published prices, and an
 * Offer without a real price is misleading structured data.
 *
 * Returns null when there are no variants, so a caller can fall back to plain
 * Product markup rather than emitting an empty group.
 */
export function productGroupJsonLd(p: {
  name: string;
  slug: string;
  category: string;
  description: string;
  brand: string;
  images: string[];
  productCode?: string | null;
  variants: {
    id: string;
    sku?: string | null;
    name?: string | null;
    size?: string | null;
    finish?: string | null;
    color?: string | null;
  }[];
}): Record<string, unknown> | null {
  const active = p.variants.filter((v) => v.sku || v.name || v.size);
  if (active.length === 0) return null;

  // Only declare an axis that genuinely differs between variants — claiming a
  // product "varies by colour" when every variant is white is a false signal.
  const varies = (key: "size" | "finish" | "color") => {
    const values = new Set(active.map((v) => v[key]).filter(Boolean));
    return values.size > 1;
  };
  const variesBy = [
    varies("size") ? "size" : null,
    varies("color") ? "color" : null,
    // schema.org has no "finish" property; pattern is the closest published
    // axis for a surface treatment.
    varies("finish") ? "pattern" : null,
  ].filter(Boolean);

  const url = `${siteUrl}/products/${p.category}/${p.slug}`;

  return {
    "@context": "https://schema.org",
    "@type": "ProductGroup",
    name: p.name,
    description: p.description,
    image: p.images.filter(Boolean),
    brand: { "@type": "Brand", name: p.brand },
    category: p.category,
    url,
    productGroupID: p.productCode || p.slug,
    ...(variesBy.length ? { variesBy } : {}),
    hasVariant: active.map((v) => ({
      "@type": "Product",
      name: v.name?.trim() || [p.name, v.size, v.finish].filter(Boolean).join(" "),
      // Every variant resolves to the group's single canonical page.
      url,
      ...(v.sku ? { sku: v.sku } : {}),
      ...(v.size ? { size: v.size } : {}),
      ...(v.color ? { color: v.color } : {}),
      ...(v.finish ? { pattern: v.finish } : {}),
    })),
  };
}
