import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-config";
import { getBlogPosts } from "@/lib/posts";
import { getCatalogProducts } from "@/lib/products";
import { getShowrooms } from "@/lib/showrooms";
import { getBrands, getBrandCategories, getBathwareCategories } from "@/lib/brands";
import { getLandingPages } from "@/lib/landing-pages";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages = [
    "",
    "/about",
    "/products",
    "/products/designer-picks",
    "/tiles",
    "/bathware",
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

  const blogPosts = await getBlogPosts();
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

  // Brand catalogue libraries — strong "<brand> dealer Mangaluru" landing pages.
  const brands = await getBrands();
  const brandsWithProducts = brands.filter((b) => b.productCount > 0);
  const brandPages = brandsWithProducts.map((b) => ({
    url: `${siteUrl}/brands/${b.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // Brand + category combinations (e.g. /brands/jaquar/faucets).
  const brandCategoryPages = (
    await Promise.all(
      brandsWithProducts.map(async (b) => {
        const cats = await getBrandCategories(b.slug);
        return cats.map((c) => ({
          url: `${siteUrl}/brands/${b.slug}/${c.slug}`,
          lastModified: new Date(),
          changeFrequency: "weekly" as const,
          priority: 0.7,
        }));
      })
    )
  ).flat();

  // Category-first bathware pages (tiles has no sub-categories yet).
  const bathwareCategories = await getBathwareCategories();
  const bathwareCategoryPages = bathwareCategories.map((c) => ({
    url: `${siteUrl}/bathware/${c.slug}`,
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

  // Local landing pages are the primary organic entry points for "<product>
  // <town>" searches, so they rank alongside the showroom pages.
  const landings = await getLandingPages();
  const landingPages = landings.map((l) => ({
    url: `${siteUrl}/${l.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  return [
    ...staticPages,
    ...landingPages,
    ...showroomPages,
    ...brandPages,
    ...brandCategoryPages,
    ...bathwareCategoryPages,
    ...posts,
    ...productPages,
  ];
}
