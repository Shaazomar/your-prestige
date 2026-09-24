import type { NextConfig } from "next";
import path from "path";

/**
 * One configured base URL → zero or one `remotePatterns` entry. Derived from
 * the URL rather than hardcoded to `https`: a bucket URL on a non-default
 * port or a local S3-compatible endpoint was previously silently registered
 * under the wrong protocol, so the optimizer rejected it and every image
 * 400'd.
 */
function urlToPattern(raw: string | undefined) {
  if (!raw) return [];
  try {
    const u = new URL(raw);
    return [
      {
        protocol: u.protocol.replace(":", "") as "http" | "https",
        hostname: u.hostname,
        ...(u.port ? { port: u.port } : {}),
      },
    ];
  } catch {
    return [];
  }
}

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      // S3 media bucket / any S3-compatible endpoint. Derived from env so
      // pointing NEXT_PUBLIC_S3_BUCKET_URL at a CloudFront domain, or
      // S3_ENDPOINT at a local/staging S3-compatible double, needs no change
      // here. Both are read because they answer different questions —
      // NEXT_PUBLIC_S3_BUCKET_URL is where public URLs are *built* from
      // (`s3-url.ts`), S3_ENDPOINT is where a non-AWS store actually *lives*
      // — and a deployment can set either one independently of the other.
      ...urlToPattern(process.env.NEXT_PUBLIC_S3_BUCKET_URL),
      ...urlToPattern(process.env.S3_ENDPOINT),
      // Virtual-hosted style: <bucket>.s3.<region>.amazonaws.com
      { protocol: "https" as const, hostname: "*.s3.ap-south-1.amazonaws.com" },
      { protocol: "https" as const, hostname: "*.s3.amazonaws.com" },
      // Path-style: s3.<region>.amazonaws.com/<bucket>/<key>. The wildcards
      // above need a subdomain label, so a path-style URL was rejected by the
      // image optimizer with a 400 and rendered as a broken image.
      { protocol: "https" as const, hostname: "s3.ap-south-1.amazonaws.com" },
      { protocol: "https" as const, hostname: "s3.amazonaws.com" },
      // Local development only — never present in a production build. A
      // fixture/seed database can hold absolute URLs pointing at whatever
      // local S3-compatible double (`scripts/fake-s3.mjs`, LocalStack, ...)
      // was running when the data was written, on whatever port it happened
      // to use that day. Without this, every one of those images doesn't
      // just show a placeholder — `next/image` throws on the unconfigured
      // host and takes the whole page down with it (a real, reproduced crash
      // on `/brands/[slug]` when a brand's `logo` held such a URL), which is
      // a much worse failure than the "broken image" this project is meant
      // to fix, and it happens instead of that fix rather than alongside it.
      ...(process.env.NODE_ENV !== "production"
        ? [
            { protocol: "http" as const, hostname: "localhost" },
            { protocol: "http" as const, hostname: "127.0.0.1" },
          ]
        : []),
    ],
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    middlewareClientMaxBodySize: "50mb",
  },
  async rewrites() {
    return [
      {
        source: "/product/:category/:slug",
        destination: "/products/:category/:slug",
      },
    ];
  },
  async redirects() {
    return [
      // Category-first browsing moved to top-level URLs as part of the
      // brand-first catalog restructure — preserve existing links/SEO.
      { source: "/products/tiles", destination: "/tiles", permanent: true },
      { source: "/products/sanitary", destination: "/bathware", permanent: true },
    ];
  },
};

export default nextConfig;
