import { getBrandSitemapRows } from "@/lib/sitemap-data";
import { sitemapResponse } from "@/lib/sitemap-xml";

export const revalidate = 3600;

/** Brand pages plus the brand x category combinations that hold products. */
export async function GET() {
  return sitemapResponse(await getBrandSitemapRows(), 3600);
}
