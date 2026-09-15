import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo-config";
import { SITEMAP_PAGE_SIZE, countPublishedProducts } from "@/lib/sitemap-data";

/**
 * Sitemap index.
 *
 * At 6,000+ products a single document meant every crawler hit rebuilt the
 * whole catalogue. This is now an index pointing at cached section files, so
 * a crawler fetching products does not also re-derive every brand and
 * category, and each section revalidates on its own schedule.
 *
 * Admin, API, account and checkout routes are absent by construction: every
 * URL here is generated from published catalogue records, so a private route
 * cannot leak in by being forgotten.
 */

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const total = await countPublishedProducts();
  const productPages = Math.max(1, Math.ceil(total / SITEMAP_PAGE_SIZE));
  const now = new Date();

  return [
    { url: absoluteUrl("/sitemap-pages.xml"), lastModified: now },
    { url: absoluteUrl("/sitemap-brands.xml"), lastModified: now },
    { url: absoluteUrl("/sitemap-categories.xml"), lastModified: now },
    // Paged so no single file approaches the 50,000-URL protocol limit.
    ...Array.from({ length: productPages }, (_, i) => ({
      url: absoluteUrl(i === 0 ? "/sitemap-products.xml" : `/sitemap-products/${i + 1}`),
      lastModified: now,
    })),
  ];
}
