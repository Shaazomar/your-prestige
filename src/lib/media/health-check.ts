import { prisma } from "@/lib/prisma";
import { resolveImageRef } from "@/lib/s3-url";
import { PUBLIC_PRODUCT_WHERE } from "@/lib/products";

/**
 * Structural media-health scan — brief §18's "Image Health Check".
 *
 * This finds problems that are visible from the database alone, with no
 * network call: a stored value that is empty (`missing`) or that
 * `resolveImageRef` can't turn into something a browser could ever request
 * (`invalid` — e.g. a bare filename with no key structure, or whitespace).
 * Live reachability (`valid` / `broken` / `unauthorized` / `unsupported`) is
 * a separate, on-demand step — see `verifyMediaUrl` — because HEAD-checking
 * every image on every page load does not scale to a five-figure catalogue
 * and would make this page itself a performance problem.
 *
 * Only the *primary* display field per entity is scanned for `missing`
 * (a product with no photography at all, a brand with no logo, ...);
 * decorative/optional fields being empty is normal, not a defect, and
 * flooding this report with every unset `bannerImage` would bury the real
 * problems. Gallery/array fields are scanned for `invalid` entries only —
 * an unset gallery is not a defect, a garbage entry in one is.
 */

export type MediaIssueStatus = "missing" | "invalid" | "broken" | "unauthorized" | "unsupported";

export interface MediaIssue {
  entity: "Product" | "Brand" | "Category" | "Collection" | "Showroom" | "AboutPerson";
  entityId: string;
  entityLabel: string;
  field: string;
  storedValue: string | null;
  resolvedUrl: string | null;
  status: MediaIssueStatus;
  /** Whether `repairMediaField` knows how to write a replacement back to this exact field. */
  repairable: boolean;
}

const arr = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.length > 0) : [];

/** A stored value resolves to nothing a browser could load. */
function isInvalid(stored: string): boolean {
  const resolved = resolveImageRef(stored);
  return !resolved;
}

async function scanProducts(): Promise<MediaIssue[]> {
  const rows = await prisma.product.findMany({
    where: PUBLIC_PRODUCT_WHERE,
    select: {
      id: true, slug: true, name: true,
      lifestyleImage: true, textureImage: true, images: true,
      image_key: true, thumbnail_key: true,
    },
  });

  const issues: MediaIssue[] = [];
  for (const r of rows) {
    const label = `${r.name} (${r.slug})`;
    const gallery = arr(r.images);

    // Same fallback order as `toCatalogProduct` — a product only truly has
    // no photography if every one of these is empty, not just the first field.
    const primary =
      resolveImageRef(r.lifestyleImage) ||
      resolveImageRef(gallery[0]) ||
      resolveImageRef(r.image_key) ||
      resolveImageRef(r.thumbnail_key) ||
      resolveImageRef(r.textureImage);

    if (!primary) {
      issues.push({
        entity: "Product", entityId: r.id, entityLabel: label,
        field: "lifestyleImage", storedValue: r.lifestyleImage, resolvedUrl: null,
        status: "missing", repairable: true,
      });
    } else if (r.lifestyleImage && isInvalid(r.lifestyleImage)) {
      issues.push({
        entity: "Product", entityId: r.id, entityLabel: label,
        field: "lifestyleImage", storedValue: r.lifestyleImage, resolvedUrl: null,
        status: "invalid", repairable: true,
      });
    }

    if (r.textureImage && isInvalid(r.textureImage)) {
      issues.push({
        entity: "Product", entityId: r.id, entityLabel: label,
        field: "textureImage", storedValue: r.textureImage, resolvedUrl: null,
        status: "invalid", repairable: true,
      });
    }

    gallery.forEach((g, i) => {
      if (isInvalid(g)) {
        issues.push({
          entity: "Product", entityId: r.id, entityLabel: label,
          field: `images[${i}]`, storedValue: g, resolvedUrl: null,
          status: "invalid", repairable: false,
        });
      }
    });
  }
  return issues;
}

async function scanBrands(): Promise<MediaIssue[]> {
  const rows = await prisma.brand.findMany({
    where: { deletedAt: null, published: true },
    select: { id: true, slug: true, name: true, logo: true, banner: true, mobileCoverImage: true, heroPoster: true, gallery: true },
  });

  const issues: MediaIssue[] = [];
  for (const r of rows) {
    const label = `${r.name} (${r.slug})`;

    if (!resolveImageRef(r.logo)) {
      issues.push({
        entity: "Brand", entityId: r.id, entityLabel: label,
        field: "logo", storedValue: r.logo, resolvedUrl: null,
        status: r.logo ? "invalid" : "missing", repairable: true,
      });
    }

    (["banner", "mobileCoverImage", "heroPoster"] as const).forEach((field) => {
      const stored = r[field];
      if (stored && isInvalid(stored)) {
        issues.push({
          entity: "Brand", entityId: r.id, entityLabel: label,
          field, storedValue: stored, resolvedUrl: null,
          status: "invalid", repairable: true,
        });
      }
    });

    arr(r.gallery).forEach((g, i) => {
      if (isInvalid(g)) {
        issues.push({
          entity: "Brand", entityId: r.id, entityLabel: label,
          field: `gallery[${i}]`, storedValue: g, resolvedUrl: null,
          status: "invalid", repairable: false,
        });
      }
    });
  }
  return issues;
}

async function scanCategories(): Promise<MediaIssue[]> {
  const rows = await prisma.category.findMany({
    where: { deletedAt: null, published: true },
    select: { id: true, slug: true, name: true, image: true, bannerImage: true },
  });

  const issues: MediaIssue[] = [];
  for (const r of rows) {
    const label = `${r.name} (${r.slug})`;
    if (r.image && isInvalid(r.image)) {
      issues.push({
        entity: "Category", entityId: r.id, entityLabel: label,
        field: "image", storedValue: r.image, resolvedUrl: null,
        status: "invalid", repairable: true,
      });
    }
    if (r.bannerImage && isInvalid(r.bannerImage)) {
      issues.push({
        entity: "Category", entityId: r.id, entityLabel: label,
        field: "bannerImage", storedValue: r.bannerImage, resolvedUrl: null,
        status: "invalid", repairable: true,
      });
    }
  }
  return issues;
}

async function scanCollections(): Promise<MediaIssue[]> {
  const rows = await prisma.collection.findMany({
    where: { deletedAt: null, published: true },
    select: { id: true, slug: true, name: true, image: true },
  });

  return rows
    .filter((r) => r.image && isInvalid(r.image))
    .map((r) => ({
      entity: "Collection" as const, entityId: r.id, entityLabel: `${r.name} (${r.slug})`,
      field: "image", storedValue: r.image, resolvedUrl: null,
      status: "invalid" as const, repairable: true,
    }));
}

async function scanShowrooms(): Promise<MediaIssue[]> {
  const rows = await prisma.showroom.findMany({
    where: { deletedAt: null, published: true },
    select: { id: true, slug: true, name: true, heroImage: true, gallery: true },
  });

  const issues: MediaIssue[] = [];
  for (const r of rows) {
    const label = `${r.name} (${r.slug})`;
    if (!resolveImageRef(r.heroImage)) {
      issues.push({
        entity: "Showroom", entityId: r.id, entityLabel: label,
        field: "heroImage", storedValue: r.heroImage, resolvedUrl: null,
        status: r.heroImage ? "invalid" : "missing", repairable: true,
      });
    }
    arr(r.gallery).forEach((g, i) => {
      if (isInvalid(g)) {
        issues.push({
          entity: "Showroom", entityId: r.id, entityLabel: label,
          field: `gallery[${i}]`, storedValue: g, resolvedUrl: null,
          status: "invalid", repairable: false,
        });
      }
    });
  }
  return issues;
}

async function scanAboutPeople(): Promise<MediaIssue[]> {
  const rows = await prisma.aboutPerson.findMany({
    where: { deletedAt: null, active: true },
    select: { id: true, name: true, image: true },
  });

  return rows
    .filter((r) => isInvalid(r.image))
    .map((r) => ({
      entity: "AboutPerson" as const, entityId: r.id, entityLabel: r.name,
      field: "image", storedValue: r.image, resolvedUrl: null,
      status: (r.image ? "invalid" : "missing") as MediaIssueStatus, repairable: true,
    }));
}

/** Every structurally-flagged media reference across the CMS, newest scan each call. */
export async function collectMediaIssues(): Promise<MediaIssue[]> {
  const [products, brands, categories, collections, showrooms, aboutPeople] = await Promise.all([
    scanProducts(), scanBrands(), scanCategories(), scanCollections(), scanShowrooms(), scanAboutPeople(),
  ]);
  return [...products, ...brands, ...categories, ...collections, ...showrooms, ...aboutPeople];
}

export interface MediaHealthStats {
  total: number;
  byStatus: Record<string, number>;
  byEntity: Record<string, number>;
}

export function summarize(issues: MediaIssue[]): MediaHealthStats {
  const byStatus: Record<string, number> = {};
  const byEntity: Record<string, number> = {};
  for (const i of issues) {
    byStatus[i.status] = (byStatus[i.status] ?? 0) + 1;
    byEntity[i.entity] = (byEntity[i.entity] ?? 0) + 1;
  }
  return { total: issues.length, byStatus, byEntity };
}

/**
 * Live reachability check for one resolved URL — on-demand only (see the
 * module comment for why this never runs across the whole catalogue
 * automatically). HEAD first; some S3/CDN configurations reject HEAD with
 * 403/405, so a ranged GET is the fallback rather than the first attempt,
 * since it actually transfers bytes.
 */
export async function verifyMediaUrl(
  url: string
): Promise<{ status: "valid" | "broken" | "unauthorized" | "unsupported"; httpStatus?: number; error?: string }> {
  const attempt = async (method: "HEAD" | "GET") => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      return await fetch(url, {
        method,
        signal: controller.signal,
        redirect: "follow",
        headers: method === "GET" ? { Range: "bytes=0-0" } : undefined,
      });
    } finally {
      clearTimeout(timer);
    }
  };

  try {
    let res = await attempt("HEAD");
    if (res.status === 405 || res.status === 501) {
      res = await attempt("GET");
    }

    if (res.status === 401 || res.status === 403) return { status: "unauthorized", httpStatus: res.status };
    if (!res.ok) return { status: "broken", httpStatus: res.status };

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.startsWith("image/") && !contentType.startsWith("video/")) {
      return { status: "unsupported", httpStatus: res.status, error: `Unexpected content-type: ${contentType || "(none)"}` };
    }
    return { status: "valid", httpStatus: res.status };
  } catch (err) {
    return { status: "broken", error: err instanceof Error ? err.message : "Request failed" };
  }
}
