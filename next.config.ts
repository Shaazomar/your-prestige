import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      // S3 media bucket. Derived from env so pointing NEXT_PUBLIC_S3_BUCKET_URL
      // at a CloudFront domain later needs no change here.
      ...(process.env.NEXT_PUBLIC_S3_BUCKET_URL
        ? [
            (() => {
              try {
                const u = new URL(process.env.NEXT_PUBLIC_S3_BUCKET_URL!);
                return {
                  // Derived from the URL rather than hardcoded to https: a
                  // bucket URL on a non-default port or a local S3-compatible
                  // endpoint was silently registered under the wrong protocol,
                  // so the optimizer rejected it and every image 400'd.
                  protocol: u.protocol.replace(":", "") as "http" | "https",
                  hostname: u.hostname,
                  ...(u.port ? { port: u.port } : {}),
                };
              } catch {
                return null;
              }
            })(),
          ].filter(
            (item): item is { protocol: "http" | "https"; hostname: string; port?: string } =>
              item !== null
          )
        : []),
      // Virtual-hosted style: <bucket>.s3.<region>.amazonaws.com
      { protocol: "https" as const, hostname: "*.s3.ap-south-1.amazonaws.com" },
      { protocol: "https" as const, hostname: "*.s3.amazonaws.com" },
      // Path-style: s3.<region>.amazonaws.com/<bucket>/<key>. The wildcards
      // above need a subdomain label, so a path-style URL was rejected by the
      // image optimizer with a 400 and rendered as a broken image.
      { protocol: "https" as const, hostname: "s3.ap-south-1.amazonaws.com" },
      { protocol: "https" as const, hostname: "s3.amazonaws.com" },
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
