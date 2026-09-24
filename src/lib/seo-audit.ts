import { headers } from "next/headers";
import { siteUrl } from "@/lib/site-config";
import { getBrands, getBrandCategories, getSectionCategories } from "@/lib/brands";
import { getCatalogProducts } from "@/lib/products";
import { getLandingPages } from "@/lib/landing-pages";

/**
 * Internal SEO audit — brief §21.
 *
 * This checks the *real rendered response* for a curated set of pages, not
 * assumptions about the code that produces it. Every other page in the
 * codebase computes its own metadata; the only way to know whether that
 * computation actually reached the browser correctly — title length, one H1,
 * a canonical that matches the URL it's served from, structured data that
 * parses — is to fetch the page the way a crawler would and read the HTML.
 *
 * Deliberately bounded rather than a full-site crawl: the catalogue is
 * 6,000+ products, and re-fetching every one of them on every audit run
 * would be slow, expensive, and mostly redundant — the product template is
 * shared, so one real product page tells you what all of them do. The set
 * below covers one page of every distinct template the site renders.
 */

export interface PageAudit {
  url: string;
  label: string;
  ok: boolean;
  httpStatus: number | null;
  title: string | null;
  titleLength: number;
  description: string | null;
  descriptionLength: number;
  canonical: string | null;
  canonicalMatchesUrl: boolean;
  h1Count: number;
  h1Text: string[];
  robotsMeta: string | null;
  imagesTotal: number;
  imagesMissingAlt: number;
  structuredDataTypes: string[];
  structuredDataParseErrors: number;
  hasBreadcrumbSchema: boolean;
  brokenLinksChecked: number;
  brokenLinksFound: { href: string; status: number }[];
  brokenImagesChecked: number;
  brokenImagesFound: { src: string; status: number }[];
  issues: string[];
}

export interface SeoAuditReport {
  generatedAt: string;
  origin: string;
  pages: PageAudit[];
  structural: {
    sitemapIndexOk: boolean;
    sitemapIndexEntries: number;
    robotsOk: boolean;
    robotsHasSitemap: boolean;
  };
  dbFindings: {
    productsMissingImage: number;
    productsTotal: number;
    brandsMissingLogo: number;
    brandsTotal: number;
    categoriesMissingImage: number;
    categoriesTotal: number;
    landingPagesMissingFaq: number;
    landingPagesTotal: number;
    orphanCategories: { slug: string; name: string }[];
  };
  summary: {
    pagesAudited: number;
    pagesWithIssues: number;
    totalIssues: number;
  };
}

/** The current request's own origin — so this works against whatever host it's actually deployed on, not a hardcoded one. */
async function currentOrigin(): Promise<string> {
  try {
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host");
    const proto = h.get("x-forwarded-proto") ?? (host?.includes("localhost") ? "http" : "https");
    if (host) return `${proto}://${host}`;
  } catch {
    /* no request context (e.g. called outside a request) */
  }
  return siteUrl;
}

function extract(html: string, re: RegExp): string | null {
  return re.exec(html)?.[1]?.trim() ?? null;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'");
}

/** Parse the parts of a rendered HTML document this audit cares about. */
function analyzeHtml(
  html: string,
  requestPath: string
): Omit<PageAudit, "url" | "label" | "ok" | "httpStatus" | "brokenLinksChecked" | "brokenLinksFound" | "brokenImagesChecked" | "brokenImagesFound"> {
  const issues: string[] = [];

  const title = extract(html, /<title>([^<]*)<\/title>/i);
  const titleText = title ? decodeEntities(title) : null;
  if (!titleText) issues.push("Missing <title>");
  else if (titleText.length > 65) issues.push(`Title is ${titleText.length} characters — over the ~60–65 that fit a SERP snippet`);

  const description = extract(
    html,
    /<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i
  );
  const descText = description ? decodeEntities(description) : null;
  if (!descText) issues.push("Missing meta description");
  else if (descText.length > 165) issues.push(`Meta description is ${descText.length} characters — over the ~155–165 Google typically shows`);

  const canonical = extract(html, /<link\s+rel=["']canonical["']\s+href=["']([^"']*)["']/i);
  // Compared by *path*, against the site's own configured origin — not the
  // origin this audit happens to be fetching from. A canonical correctly
  // points at the production `siteUrl` regardless of what host actually
  // served the audit's request (a staging/preview deploy, a local test
  // server); comparing full origins would flag every single page as broken
  // on any environment other than production itself.
  let canonicalPath: string | null = null;
  if (canonical) {
    try {
      const u = new URL(canonical, siteUrl);
      canonicalPath = u.pathname + u.search;
    } catch {
      canonicalPath = null;
    }
  }
  const normalize = (p: string) => (p.length > 1 ? p.replace(/\/$/, "") : p);
  const canonicalMatchesUrl = !!canonicalPath && normalize(canonicalPath) === normalize(requestPath);
  if (!canonical) issues.push("Missing canonical link");
  else if (!canonicalPath) issues.push(`Canonical (${canonical}) is not a valid URL`);
  else if (!canonicalMatchesUrl) {
    issues.push(`Canonical path (${canonicalPath}) does not match the path this page was requested at (${requestPath})`);
  }

  const h1Matches = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)];
  const h1Text = h1Matches.map((m) => decodeEntities(m[1].replace(/<[^>]+>/g, "").trim())).filter(Boolean);
  if (h1Text.length === 0) issues.push("No <h1> found");
  if (h1Text.length > 1) issues.push(`${h1Text.length} <h1> elements found — expected exactly one`);

  const robotsMeta = extract(html, /<meta\s+name=["']robots["']\s+content=["']([^"']*)["']/i);

  const imgTags = [...html.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]);
  const imagesMissingAlt = imgTags.filter((tag) => !/\balt\s*=/.test(tag)).length;
  if (imagesMissingAlt > 0) {
    issues.push(`${imagesMissingAlt} of ${imgTags.length} <img> tags have no alt attribute at all`);
  }

  const ldBlocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)];
  const structuredDataTypes: string[] = [];
  let structuredDataParseErrors = 0;
  for (const block of ldBlocks) {
    try {
      const parsed = JSON.parse(block[1]);
      const items = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of items) {
        if (item && typeof item === "object" && "@type" in item) {
          const t = item["@type"];
          if (typeof t === "string") structuredDataTypes.push(t);
          else if (Array.isArray(t)) structuredDataTypes.push(...t.filter((x) => typeof x === "string"));
        }
      }
    } catch {
      structuredDataParseErrors++;
    }
  }
  if (structuredDataParseErrors > 0) {
    issues.push(`${structuredDataParseErrors} structured-data block(s) failed to parse as JSON`);
  }
  const hasBreadcrumbSchema = structuredDataTypes.includes("BreadcrumbList");

  return {
    title: titleText,
    titleLength: titleText?.length ?? 0,
    description: descText,
    descriptionLength: descText?.length ?? 0,
    canonical,
    canonicalMatchesUrl,
    h1Count: h1Text.length,
    h1Text,
    robotsMeta,
    imagesTotal: imgTags.length,
    imagesMissingAlt,
    structuredDataTypes: [...new Set(structuredDataTypes)],
    structuredDataParseErrors,
    hasBreadcrumbSchema,
    issues,
  };
}

/** Internal links and image srcs, deduplicated, for the broken-link/image spot check. */
function extractLinksAndImages(html: string, origin: string) {
  const hrefs = [...html.matchAll(/<a\s[^>]*href=["']([^"'#]+)["']/gi)]
    .map((m) => decodeEntities(m[1]))
    .filter((h) => h.startsWith("/") || h.startsWith(origin))
    .map((h) => (h.startsWith("/") ? `${origin}${h}` : h));

  const srcs = [...html.matchAll(/<img\b[^>]*\bsrc=["']([^"']+)["']/gi)]
    .map((m) => decodeEntities(m[1]))
    .filter((s) => !s.startsWith("data:"))
    .map((s) => (s.startsWith("/") ? `${origin}${s}` : s));

  return { hrefs: [...new Set(hrefs)], srcs: [...new Set(srcs)] };
}

async function checkStatus(url: string): Promise<number> {
  try {
    // GET, not HEAD: Next's own `/_next/image` optimizer and more than a few
    // third-party image hosts respond to HEAD inconsistently (some 400/403 a
    // HEAD that a GET for the identical URL serves fine), which reads as a
    // broken image that isn't one. The response body is left unread and
    // garbage-collected — only the status matters here.
    const res = await fetch(url, { method: "GET", redirect: "manual", signal: AbortSignal.timeout(8000) });
    // A redirect (301/307/etc.) is not broken — only report genuine failures.
    if (res.status >= 300 && res.status < 400) return 200;
    return res.status;
  } catch {
    return 0;
  }
}

const LINK_SAMPLE_SIZE = 12;
const IMAGE_SAMPLE_SIZE = 8;

async function auditOnePage(origin: string, path: string, label: string): Promise<PageAudit> {
  const url = `${origin}${path}`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    const html = await res.text();

    if (!res.ok) {
      return {
        url, label, ok: false, httpStatus: res.status,
        title: null, titleLength: 0, description: null, descriptionLength: 0,
        canonical: null, canonicalMatchesUrl: false, h1Count: 0, h1Text: [],
        robotsMeta: null, imagesTotal: 0, imagesMissingAlt: 0,
        structuredDataTypes: [], structuredDataParseErrors: 0, hasBreadcrumbSchema: false,
        brokenLinksChecked: 0, brokenLinksFound: [], brokenImagesChecked: 0, brokenImagesFound: [],
        issues: [`Page returned HTTP ${res.status}`],
      };
    }

    const analysis = analyzeHtml(html, path);
    const { hrefs, srcs } = extractLinksAndImages(html, origin);

    const linkSample = hrefs.slice(0, LINK_SAMPLE_SIZE);
    const imageSample = srcs.slice(0, IMAGE_SAMPLE_SIZE);

    const [linkStatuses, imageStatuses] = await Promise.all([
      Promise.all(linkSample.map(async (href) => ({ href, status: await checkStatus(href) }))),
      Promise.all(imageSample.map(async (src) => ({ src, status: await checkStatus(src) }))),
    ]);

    const brokenLinksFound = linkStatuses.filter((l) => l.status === 0 || l.status >= 400);
    const brokenImagesFound = imageStatuses.filter((i) => i.status === 0 || i.status >= 400);

    const issues = [...analysis.issues];
    if (brokenLinksFound.length > 0) {
      issues.push(`${brokenLinksFound.length} of ${linkSample.length} sampled internal links are broken`);
    }
    if (brokenImagesFound.length > 0) {
      issues.push(`${brokenImagesFound.length} of ${imageSample.length} sampled images are broken`);
    }

    return {
      url, label, ok: true, httpStatus: res.status,
      ...analysis,
      brokenLinksChecked: linkSample.length,
      brokenLinksFound,
      brokenImagesChecked: imageSample.length,
      brokenImagesFound,
      issues,
    };
  } catch (err) {
    return {
      url, label, ok: false, httpStatus: null,
      title: null, titleLength: 0, description: null, descriptionLength: 0,
      canonical: null, canonicalMatchesUrl: false, h1Count: 0, h1Text: [],
      robotsMeta: null, imagesTotal: 0, imagesMissingAlt: 0,
      structuredDataTypes: [], structuredDataParseErrors: 0, hasBreadcrumbSchema: false,
      brokenLinksChecked: 0, brokenLinksFound: [], brokenImagesChecked: 0, brokenImagesFound: [],
      issues: [`Fetch failed: ${err instanceof Error ? err.message : String(err)}`],
    };
  }
}

/** One representative URL per distinct page template the site renders. */
async function representativeUrls(): Promise<{ path: string; label: string }[]> {
  const urls: { path: string; label: string }[] = [
    { path: "/", label: "Homepage" },
    { path: "/products", label: "Products index" },
    { path: "/tiles", label: "Tiles section" },
    { path: "/bathware", label: "Bathware section" },
    { path: "/brands", label: "Brands index" },
    { path: "/collections", label: "Collections index" },
    { path: "/showrooms", label: "Showrooms index" },
    { path: "/about", label: "About" },
  ];

  try {
    const brands = await getBrands();
    const brand = brands.find((b) => b.productCount > 0);
    if (brand) {
      urls.push({ path: `/brands/${brand.slug}`, label: `Brand — ${brand.name}` });
      const cats = await getBrandCategories(brand.slug);
      if (cats[0]) {
        urls.push({
          path: `/brands/${brand.slug}/${cats[0].slug}`,
          label: `Brand × category — ${brand.name} / ${cats[0].name}`,
        });
      }
    }
  } catch { /* best-effort */ }

  try {
    const tileCats = await getSectionCategories("tiles");
    if (tileCats[0]) urls.push({ path: `/tiles/${tileCats[0].slug}`, label: `Tile category — ${tileCats[0].name}` });
    const bathCats = await getSectionCategories("bathware");
    if (bathCats[0]) urls.push({ path: `/bathware/${bathCats[0].slug}`, label: `Bathware category — ${bathCats[0].name}` });
  } catch { /* best-effort */ }

  try {
    const products = await getCatalogProducts({ limit: 1 });
    if (products[0]) {
      urls.push({
        path: `/products/${products[0].category}/${products[0].slug}`,
        label: `Product — ${products[0].name}`,
      });
    }
  } catch { /* best-effort */ }

  try {
    const landingPages = await getLandingPages();
    if (landingPages[0]) {
      urls.push({ path: `/${landingPages[0].slug}`, label: `Local landing page — ${landingPages[0].title}` });
    }
  } catch { /* best-effort */ }

  return urls;
}

async function checkStructural(origin: string) {
  let sitemapIndexOk = false;
  let sitemapIndexEntries = 0;
  try {
    const res = await fetch(`${origin}/sitemap.xml`, { signal: AbortSignal.timeout(10000) });
    if (res.ok) {
      const xml = await res.text();
      sitemapIndexOk = true;
      sitemapIndexEntries = [...xml.matchAll(/<sitemap>/g)].length;
    }
  } catch { /* reported via sitemapIndexOk = false */ }

  let robotsOk = false;
  let robotsHasSitemap = false;
  try {
    const res = await fetch(`${origin}/robots.txt`, { signal: AbortSignal.timeout(10000) });
    if (res.ok) {
      robotsOk = true;
      const text = await res.text();
      robotsHasSitemap = /sitemap:/i.test(text);
    }
  } catch { /* reported via robotsOk = false */ }

  return { sitemapIndexOk, sitemapIndexEntries, robotsOk, robotsHasSitemap };
}

const EMPTY_DB_FINDINGS: SeoAuditReport["dbFindings"] = {
  productsMissingImage: 0, productsTotal: 0,
  brandsMissingLogo: 0, brandsTotal: 0,
  categoriesMissingImage: 0, categoriesTotal: 0,
  landingPagesMissingFaq: 0, landingPagesTotal: 0,
  orphanCategories: [],
};

async function checkDbFindings(): Promise<SeoAuditReport["dbFindings"]> {
  try {
    const { prisma } = await import("@/lib/prisma");
    const { getSubtreeProductCounts } = await import("@/lib/category-tree");
    const PUBLISHED = { published: true, deletedAt: null } as const;

    const [
      productsTotal,
      productsMissingImage,
      brandsTotal,
      brandsMissingLogo,
      categoriesTotal,
      categoriesMissingImage,
      landingPagesTotal,
      landingPagesWithFaqs,
      allCategories,
    ] = await Promise.all([
      prisma.product.count({ where: PUBLISHED }),
      prisma.product.count({ where: { ...PUBLISHED, lifestyleImage: null, image_key: null, thumbnail_key: null } }),
      prisma.brand.count({ where: PUBLISHED }),
      prisma.brand.count({ where: { ...PUBLISHED, logo: null } }),
      prisma.category.count({ where: PUBLISHED }),
      prisma.category.count({ where: { ...PUBLISHED, image: null } }),
      prisma.landingPage.count({ where: PUBLISHED }),
      // `faqs` is a nullable Json array; counted in JS below rather than in
      // the query, because a Postgres JSON `equals: []` filter doesn't also
      // match rows where the column is SQL NULL, and both mean "no FAQs".
      prisma.landingPage.findMany({ where: PUBLISHED, select: { faqs: true } }),
      prisma.category.findMany({ where: PUBLISHED, select: { id: true, slug: true, name: true } }),
    ]);

    const landingPagesMissingFaq = landingPagesWithFaqs.filter(
      (r) => !Array.isArray(r.faqs) || r.faqs.length === 0
    ).length;

    // A category's *own* row rarely holds products directly — the taxonomy
    // is up to three levels deep (bathware > wellness > spa-systems), and a
    // section root like "Tiles" holds none of its 2,800+ products on itself,
    // only on its descendants. Counting direct products only — as an earlier
    // version of this check did — flagged "Tiles" and "Bathware" themselves
    // as orphaned, which is exactly backwards. `getSubtreeProductCounts` is
    // the same subtree-aware helper `/tiles`, `/bathware` and their category
    // pages already use to answer "how many products does this page show".
    const counts = await getSubtreeProductCounts(allCategories.map((c) => c.id));
    const orphanCategories = allCategories
      .filter((c) => (counts.get(c.id) ?? 0) === 0)
      .slice(0, 25)
      .map((c) => ({ slug: c.slug, name: c.name }));

    return {
      productsTotal,
      productsMissingImage,
      brandsTotal,
      brandsMissingLogo,
      categoriesTotal,
      categoriesMissingImage,
      landingPagesTotal,
      landingPagesMissingFaq,
      orphanCategories,
    };
  } catch {
    // A structural DB problem is exactly what an audit tool should survive to
    // report the *rest* of its findings around, not crash on.
    return EMPTY_DB_FINDINGS;
  }
}

export async function runSeoAudit(): Promise<SeoAuditReport> {
  const origin = await currentOrigin();
  const targets = await representativeUrls();

  const [pages, structural, dbFindings] = await Promise.all([
    Promise.all(targets.map((t) => auditOnePage(origin, t.path, t.label))),
    checkStructural(origin),
    checkDbFindings(),
  ]);

  const pagesWithIssues = pages.filter((p) => p.issues.length > 0).length;
  const totalIssues = pages.reduce((sum, p) => sum + p.issues.length, 0);

  return {
    generatedAt: new Date().toISOString(),
    origin,
    pages,
    structural,
    dbFindings,
    summary: {
      pagesAudited: pages.length,
      pagesWithIssues,
      totalIssues,
    },
  };
}
