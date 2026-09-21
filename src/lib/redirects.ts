import { cache } from "react";
import { prisma } from "@/lib/prisma";

/**
 * CMS-managed URL redirects.
 *
 * The admin "SEO Studio" has had a full CRUD UI for these since before this
 * audit (`/admin/seo` → Redirects), and it creates real `Redirect` rows — but
 * nothing on the public site ever read the table. An editor could create a
 * redirect, see it listed, and it would do precisely nothing: the old URL
 * still 404'd. That is the exact "fix redirects" defect this audit was asked
 * to find.
 *
 * This is wired into `src/app/(site)/[landing]/page.tsx`, the route that
 * already catches every unmatched single-segment top-level path — which is
 * also what the admin form's own placeholder (`/old-page`) describes. A
 * multi-segment `fromPath` (`/products/tiles/old-slug`) won't be caught here,
 * because Next resolves the real `/products/[category]/[slug]` route for that
 * path before a catch-all like `[landing]` is ever reached — see the SEO
 * report for that limitation and what fuller coverage would require.
 *
 * Deliberately not middleware. Middleware already carries the site's auth
 * gate and is scoped to `/admin` and `/api/admin` for exactly that reason —
 * broadening its matcher to run on every public request would mean a Postgres
 * round trip (Prisma is not Edge-safe by default) on every single page view,
 * including all 6,000+ product pages, for a lookup that misses almost every
 * time. That is a real latency and Core Web Vitals cost for a feature this
 * route can serve for its actual use case at zero cost to normal traffic —
 * `getActiveRedirect` only ever runs after a lookup has already failed.
 */
export const getActiveRedirect = cache(
  async (fromPath: string): Promise<{ toPath: string; statusCode: number } | null> => {
    try {
      const row = await prisma.redirect.findUnique({ where: { fromPath } });
      if (!row || !row.active) return null;
      return { toPath: row.toPath, statusCode: row.statusCode };
    } catch {
      return null;
    }
  }
);
