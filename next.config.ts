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
            {
              protocol: "https" as const,
              hostname: new URL(process.env.NEXT_PUBLIC_S3_BUCKET_URL).hostname,
            },
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
};

export default nextConfig;
