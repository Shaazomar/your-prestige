import { getProductSitemapRows } from "@/lib/sitemap-data";
import { sitemapResponse } from "@/lib/sitemap-xml";

export const revalidate = 3600;

/**
 * The first page of product URLs. Further pages are served by
 * /sitemap-products-[n].xml, and the index lists however many the catalogue
 * currently needs.
 */
export async function GET() {
  return sitemapResponse(await getProductSitemapRows(0), 3600);
}
