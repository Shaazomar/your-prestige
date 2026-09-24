/**
 * The one place S3 configuration is read from the environment, and the one
 * place a stored media reference turns into a URL a browser can load.
 *
 * Split out of `s3.ts` on purpose: that module imports the AWS SDK and the
 * storage adapter (which pulls in `fs`), so it can only ever run in a Node
 * server context. This file is pure string work with zero dependencies, so
 * it's safe to import from anywhere — a data-layer function building a
 * catalogue row, a client component, the media-upload service, or `s3.ts`
 * itself.
 *
 * Before this consolidation, four different files independently recomputed
 * the bucket/region/base-URL from `process.env` — `s3-url.ts`, `s3.ts`'s
 * `getS3Config()`, `media/s3-service.ts`'s `objectUrlForKey()`, and
 * `storage.ts`'s `uploadToS3()` — and they had already drifted: only some of
 * them recognised `S3_ENDPOINT` (for an S3-compatible store or a local test
 * double), and `storage.ts`'s version skipped per-segment URL-encoding
 * entirely, which would have produced a broken URL for any key containing a
 * space or other character `encodeURIComponent` needs to escape. The other
 * three now derive from this one.
 */

export const S3_BUCKET = process.env.S3_BUCKET || process.env.AWS_S3_BUCKET || "your-prestige-in";
export const S3_REGION = process.env.S3_REGION || process.env.AWS_REGION || "ap-south-1";

/** Custom endpoint, for an S3-compatible store or a local test double. Unset in production. */
export const S3_ENDPOINT = process.env.S3_ENDPOINT?.trim() || undefined;

/**
 * Base URL objects are served from. Point NEXT_PUBLIC_S3_BUCKET_URL at a
 * CloudFront distribution and every stored key follows it with no data change.
 */
export const S3_BASE_URL = (
  process.env.NEXT_PUBLIC_S3_BUCKET_URL ||
  (S3_ENDPOINT ? `${S3_ENDPOINT.replace(/\/$/, "")}/${S3_BUCKET}` : `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com`)
).replace(/\/+$/, "");

/**
 * `${S3_BASE_URL}/${key}`, with every path segment individually
 * URL-encoded so a space, `#`, `%`, or non-ASCII character in the key
 * survives as a valid URL — without escaping the slashes that give the key
 * its folder structure.
 */
export function buildObjectUrl(key: string): string {
  const clean = key.replace(/^\/+/, "");
  const encoded = clean.split("/").map(encodeURIComponent).join("/");
  return `${S3_BASE_URL}/${encoded}`;
}

/**
 * Resolve a stored media reference to something a browser (or `next/image`)
 * can load. Accepts what the database actually holds, which is a mix:
 *  - an S3 object key ("catalog/somany/dune-taupe.webp") → built into a full
 *    URL via `buildObjectUrl`;
 *  - an absolute URL (CMS uploads, Cloudinary, Unsplash) → returned as-is;
 *  - a site-relative path ("/uploads/x.png") → returned as-is;
 *  - null/empty → null, so callers can fall through to the next candidate.
 *
 * Idempotent: resolving an already-resolved URL is a no-op, so calling this
 * defensively on a value that might already be absolute is always safe.
 */
export function resolveImageRef(ref: string | null | undefined): string | null {
  const value = ref?.trim();
  if (!value) return null;

  // Already a URL, a protocol-relative URL, or a site-relative path.
  if (/^https?:\/\//i.test(value) || value.startsWith("//") || value.startsWith("/")) {
    return value;
  }

  return buildObjectUrl(value);
}
