/**
 * The single source of truth for site-level SEO identity.
 *
 * `siteUrl` used to be a hardcoded constant in site-config.ts, which meant a
 * preview or staging deployment emitted canonicals and OG URLs pointing at
 * production. It is now environment-driven, with the production domain as the
 * fallback so nothing breaks if the variable is unset.
 *
 * Positioning note: Prestige is not a tile-only business. The catalogue spans
 * tiles and surfaces *and* bathware, sanitaryware, faucets, showers, wellness
 * and kitchen products across many brands, so the default title and
 * description below describe the whole business. Page-level metadata narrows
 * from here; it never re-narrows the brand to "tiles".
 */

function resolveSiteUrl(): string {
  const explicit =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.SITE_URL ??
    // Vercel sets this per deployment; it keeps preview canonicals pointing at
    // the preview rather than at production.
    (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production" && process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : undefined);

  const raw = explicit ?? "https://prestigetiles.in";
  // Trailing slashes produce "https://site.com//path" canonicals.
  return raw.replace(/\/+$/, "");
}

export const SITE_URL = resolveSiteUrl();

export const SITE_NAME = "Prestige";

/** Full legal/trading name, for Organization markup and the title template. */
export const SITE_LEGAL_NAME = "Prestige Tiles & Sanitary";

export const DEFAULT_TITLE =
  "Prestige | Premium Tiles, Bathware, Sanitaryware & Home Solutions";

export const DEFAULT_DESCRIPTION =
  "Premium tiles and surfaces, bathware, sanitaryware, faucets, showers and wellness products from the world's leading brands — displayed at full scale across our Mangaluru showrooms.";

export const DEFAULT_OG_IMAGE = `${SITE_URL}/brand/og-image.png`;
export const DEFAULT_TWITTER_IMAGE = DEFAULT_OG_IMAGE;

/** Absolute, canonical URL for a site-relative path. */
export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Query parameters that produce a genuinely different, worth-indexing page.
 *
 * Everything else — a colour filter, a size filter, a sort order — creates a
 * near-duplicate of the clean category page. With 6,000+ products the
 * combinations run to millions of URLs, so those self-canonicalise to the
 * clean path and are kept out of the index. Pagination is the exception: deep
 * pages are how a crawler reaches the long tail, so they stay indexable and
 * self-canonical.
 */
const INDEXABLE_PARAMS = new Set(["page"]);

export interface CrawlDirectives {
  canonical: string;
  robots: { index: boolean; follow: boolean };
}

/**
 * Decide the canonical URL and index/follow rules for a listing page given the
 * query string it was requested with.
 *
 * `follow` stays true even when `index` is false: a filtered page is not worth
 * indexing, but the product links on it are still how a crawler discovers the
 * catalogue.
 */
export function crawlDirectivesFor(
  path: string,
  searchParams: Record<string, string | string[] | undefined>
): CrawlDirectives {
  const active = Object.entries(searchParams).filter(
    ([, v]) => typeof v === "string" && v.trim().length > 0
  );

  const hasFilters = active.some(([k]) => !INDEXABLE_PARAMS.has(k));
  const page = typeof searchParams.page === "string" ? searchParams.page : undefined;

  // A filtered view points at the clean page. A paginated view points at
  // itself, so page 7 is not collapsed into page 1.
  if (hasFilters) {
    return { canonical: absoluteUrl(path), robots: { index: false, follow: true } };
  }

  if (page && page !== "1") {
    return {
      canonical: absoluteUrl(`${path}?page=${encodeURIComponent(page)}`),
      robots: { index: true, follow: true },
    };
  }

  return { canonical: absoluteUrl(path), robots: { index: true, follow: true } };
}
