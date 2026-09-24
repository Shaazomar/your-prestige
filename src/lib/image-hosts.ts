/**
 * Client-safe mirror of `next.config.ts`'s image `remotePatterns` — used by
 * `SafeImage` to decide whether a URL is safe to hand to the Next.js image
 * optimizer, or whether it should render unoptimized instead.
 *
 * `next/image` throws — not a load error `onError` can catch, a render-time
 * exception — when a `src`'s host isn't in `remotePatterns`. Keeping
 * `next.config.ts` correct prevents that for every *known* legitimate host,
 * but a genuinely unknown one can still reach a component (a scraped
 * `sourceImageUrl` from an arbitrary third-party domain, a stale fixture
 * pointing at a local double that no longer runs). This is the second,
 * independent layer: SafeImage checks first and quietly falls back to an
 * unoptimized `<Image>` — which skips that validation entirely — instead of
 * taking the page down. Two layers because they catch different things: the
 * config fixes it for everyone up front, this catches whatever the config
 * didn't anticipate.
 *
 * Only `NEXT_PUBLIC_*` env vars are read here on purpose — this module ships
 * to the browser, and `S3_ENDPOINT` (server-only, local-double-only) has no
 * business in a client bundle. `next.config.ts` still covers that case
 * server-side; a URL on that host renders correctly on first load, and only
 * needs this fallback if it fails validation for some other reason.
 */

const STATIC_HOSTS = [
  "images.unsplash.com",
  "res.cloudinary.com",
  "*.s3.ap-south-1.amazonaws.com",
  "*.s3.amazonaws.com",
  "s3.ap-south-1.amazonaws.com",
  "s3.amazonaws.com",
];

function hostnameOf(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

function matches(hostname: string, pattern: string): boolean {
  if (!pattern.startsWith("*.")) return hostname === pattern;
  const suffix = pattern.slice(1); // ".s3.ap-south-1.amazonaws.com"
  return hostname.endsWith(suffix) && hostname.length > suffix.length;
}

/**
 * Is this URL on a host the image optimizer is (or should be) configured
 * for? Relative/protocol-relative paths and non-http(s) `src` values (data
 * URIs, local static imports) are always fine — only an absolute http(s) URL
 * can fail this check.
 */
export function isKnownImageHost(src: string): boolean {
  if (!/^https?:\/\//i.test(src)) return true;

  const hostname = hostnameOf(src);
  if (!hostname) return false;

  if (process.env.NODE_ENV !== "production" && (hostname === "localhost" || hostname === "127.0.0.1")) {
    return true;
  }

  const bucketUrl = process.env.NEXT_PUBLIC_S3_BUCKET_URL;
  if (bucketUrl) {
    const bucketHost = hostnameOf(bucketUrl);
    if (bucketHost && hostname === bucketHost) return true;
  }

  return STATIC_HOSTS.some((pattern) => matches(hostname, pattern));
}
