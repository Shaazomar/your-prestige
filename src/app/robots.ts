import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo-config";

/**
 * robots.txt.
 *
 * The disallow list names private surfaces explicitly. Note what is *not*
 * here: no wildcard over query strings. Filtered listing URLs are kept out of
 * the index by a `noindex` meta tag instead (see `crawlDirectivesFor`), which
 * still lets crawlers follow the product links on those pages — a
 * `Disallow: /*?*` would block the crawl entirely and hide the long tail of
 * the catalogue.
 *
 * The catalogue paths (/products, /brands, /tiles, /bathware, /collections)
 * are deliberately never disallowed.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/api/",
          "/dashboard/",
          "/account/",
          "/cart/",
          "/checkout/",
          "/orders/",
          // Internal search results are thin, duplicate-heavy pages.
          "/search",
          // Personal, per-visitor lists held in localStorage — nothing to index.
          "/wishlist",
          "/compare",
        ],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/").replace(/\/$/, ""),
  };
}
