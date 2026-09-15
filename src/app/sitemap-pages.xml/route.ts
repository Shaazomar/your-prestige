import { absoluteUrl } from "@/lib/seo-config";
import { sitemapResponse } from "@/lib/sitemap-xml";

export const revalidate = 86400;

/**
 * Static public pages. Deliberately an explicit list rather than a directory
 * walk: /admin, /api and any future private route can never appear here by
 * being forgotten, because nothing is included unless it is named.
 */
const PAGES: [path: string, priority: number][] = [
  ["", 1.0],
  ["/about", 0.7],
  ["/products", 0.9],
  ["/products/designer-picks", 0.8],
  ["/tiles", 0.9],
  ["/bathware", 0.9],
  ["/brands", 0.9],
  ["/collections", 0.8],
  ["/showrooms", 0.9],
  ["/applications", 0.6],
  ["/portfolio", 0.6],
  ["/gallery", 0.6],
  ["/testimonials", 0.5],
  ["/blog", 0.6],
  ["/faqs", 0.5],
  ["/offers", 0.6],
  ["/contact", 0.7],
  ["/book-visit", 0.7],
  ["/request-quote", 0.7],
  ["/become-dealer", 0.5],
  ["/privacy", 0.2],
  ["/terms", 0.2],
];

export function GET() {
  const now = new Date();
  return sitemapResponse(
    PAGES.map(([path, priority]) => ({
      url: absoluteUrl(path || "/"),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority,
    })),
    86400
  );
}
