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
                return {
                  protocol: "https" as const,
                  hostname: new URL(process.env.NEXT_PUBLIC_S3_BUCKET_URL).hostname,
                };
              } catch {
                return null;
              }
            })(),
          ].filter((item): item is { protocol: "https"; hostname: string } => item !== null)
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
