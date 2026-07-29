import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-config";
import { blogPosts } from "@/lib/blog-content";
import { getCatalogProducts } from "@/lib/products";
import { getShowrooms } from "@/lib/showrooms";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages = [
    "",
    "/about",
    "/products",
    "/products/tiles",
    "/products/sanitary",
    "/products/designer-picks",
    "/brands",
    "/showrooms",
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
    priority: path === "" ? 1 : path === "/showrooms" ? 0.9 : 0.8,
  }));

  const posts = blogPosts.map((p) => ({
    url: `${siteUrl}/blog/${p.slug}`,
    lastModified: new Date(p.date),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  // The whole published catalogue, not just the client-rendered slice.
  const products = await getCatalogProducts({ limit: 5000 });
  const productPages = products.map((p) => ({
    url: `${siteUrl}/products/${p.category}/${p.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // Showroom pages are high-value local-SEO landing pages.
  const showrooms = await getShowrooms();
  const showroomPages = showrooms.map((s) => ({
    url: `${siteUrl}/showrooms/${s.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  return [...staticPages, ...showroomPages, ...posts, ...productPages];
}
