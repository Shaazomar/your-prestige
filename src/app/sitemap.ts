import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-config";
import { blogPosts } from "@/lib/blog-content";
import { products } from "@/lib/demo-content";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = [
    "",
    "/about",
    "/products",
    "/products/tiles",
    "/products/sanitary",
    "/products/designer-picks",
    "/brands",
    "/portfolio",
    "/gallery",
    "/testimonials",
    "/blog",
    "/faqs",
    "/offers",
    "/contact",
    "/book-visit",
    "/request-quote",
  ].map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.8,
  }));

  const posts = blogPosts.map((p) => ({
    url: `${siteUrl}/blog/${p.slug}`,
    lastModified: new Date(p.date),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const productPages = products.map((p) => ({
    url: `${siteUrl}/products/${p.category}/${p.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...posts, ...productPages];
}
