import { getCategorySitemapRows } from "@/lib/sitemap-data";
import { sitemapResponse } from "@/lib/sitemap-xml";

export const revalidate = 3600;

/** Top-level sections, their categories, and collections. */
export async function GET() {
  return sitemapResponse(await getCategorySitemapRows(), 3600);
}
