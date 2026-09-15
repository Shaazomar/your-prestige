import type { SitemapRow } from "@/lib/sitemap-data";

/** Escape the five XML entities — a slug or title could contain any of them. */
function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Render rows as a urlset document with a cacheable response. */
export function sitemapResponse(rows: SitemapRow[], maxAgeSeconds: number): Response {
  const body =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    rows
      .map(
        (r) =>
          `  <url>\n` +
          `    <loc>${esc(r.url)}</loc>\n` +
          `    <lastmod>${r.lastModified.toISOString()}</lastmod>\n` +
          `    <changefreq>${r.changeFrequency}</changefreq>\n` +
          `    <priority>${r.priority.toFixed(1)}</priority>\n` +
          `  </url>`
      )
      .join("\n") +
    `\n</urlset>\n`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      // Crawlers re-fetch sitemaps often; serve them from cache rather than
      // re-querying 6,000 rows each time.
      "Cache-Control": `public, max-age=0, s-maxage=${maxAgeSeconds}, stale-while-revalidate=86400`,
    },
  });
}
