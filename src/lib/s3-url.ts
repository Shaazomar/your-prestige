/**
 * Turning a stored S3 object key into a public URL.
 *
 * Split out of `s3.ts` on purpose: that module imports the AWS SDK and the
 * storage adapter (which pulls in `fs`), so it can only ever run in a Node
 * server context. Resolving a key to a URL is pure string work, and the
 * catalogue needs it on every product row it renders.
 *
 * `Product.image_key` / `Product.thumbnail_key` are written by the depot's
 * master import, which stores keys rather than URLs — see the schema comment
 * on those columns. Nothing read them, so every product whose photography
 * arrived that way rendered with no usable image source.
 */

const S3_BUCKET = process.env.S3_BUCKET || process.env.AWS_S3_BUCKET || "your-prestige-in";
const S3_REGION = process.env.S3_REGION || process.env.AWS_REGION || "ap-south-1";

/**
 * Base URL objects are served from. Point NEXT_PUBLIC_S3_BUCKET_URL at a
 * CloudFront distribution and every stored key follows it with no data change.
 */
export const S3_BASE_URL = (
  process.env.NEXT_PUBLIC_S3_BUCKET_URL || `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com`
).replace(/\/+$/, "");

/**
 * Resolve a stored image reference to something `next/image` can load.
 *
 * Accepts what the database actually holds, which is a mix:
 *  - an S3 object key ("catalog/somany/dune-taupe.webp") → prefixed with the
 *    bucket base URL;
 *  - an absolute URL (CMS uploads, Cloudinary, Unsplash) → returned as-is;
 *  - a site-relative path ("/uploads/x.png") → returned as-is;
 *  - null/empty → null, so callers can fall through to the next candidate.
 */
export function resolveImageRef(ref: string | null | undefined): string | null {
  const value = ref?.trim();
  if (!value) return null;

  // Already a URL, a protocol-relative URL, or a site-relative path.
  if (/^https?:\/\//i.test(value) || value.startsWith("//") || value.startsWith("/")) {
    return value;
  }

  // Anything else is an object key. Encode each segment so spaces and other
  // characters in a key survive as a valid URL, without escaping the slashes
  // that give the key its folder structure.
  const key = value.replace(/^\/+/, "");
  const encoded = key.split("/").map(encodeURIComponent).join("/");
  return `${S3_BASE_URL}/${encoded}`;
}
