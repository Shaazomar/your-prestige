import { getProductSitemapRows } from "@/lib/sitemap-data";
import { sitemapResponse } from "@/lib/sitemap-xml";

export const revalidate = 3600;

/**
 * Product URLs beyond the first file, served at /sitemap-products/2 and up.
 *
 * A dynamic segment cannot live inside a folder named like a file
 * ("sitemap-products-[page].xml"), so the extra pages sit on a path segment
 * instead. Sitemaps are identified by Content-Type, not by a .xml suffix, and
 * the index lists whichever pages the catalogue currently needs.
 *
 * Anything that is not a sane page number returns an empty urlset rather than
 * an error — a crawler should never get a 500 from a sitemap.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ page: string }> }
) {
  const { page } = await params;
  const n = Number(page);
  if (!Number.isInteger(n) || n < 2 || n > 1000) return sitemapResponse([], 3600);
  return sitemapResponse(await getProductSitemapRows(n - 1), 3600);
}
