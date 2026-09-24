import type { Metadata } from "next";
import { Hero } from "@/components/site/home/Hero";
import { Collections } from "@/components/site/home/Collections";
import { FeaturedProductsSection } from "@/components/site/home/FeaturedProductsSection";
import { StatsSection } from "@/components/site/home/StatsSection";
import { ApplicationsSection } from "@/components/site/home/ApplicationsSection";
import { AboutEditorial } from "@/components/site/home/AboutEditorial";
import { WhyChooseUs } from "@/components/site/home/WhyChooseUs";
import { ShowroomsSection } from "@/components/site/home/ShowroomsSection";
import { LocalGuides } from "@/components/site/home/LocalGuides";
import { Testimonials } from "@/components/site/home/Testimonials";
import { CtaSection } from "@/components/site/home/CtaSection";
import { getPublishedHomepageHero } from "@/app/admin/(dashboard)/content/homepage/actions";
import { getCatalogProducts } from "@/lib/products";
import { getShowrooms, showroomCities } from "@/lib/showrooms";
import { applySeo, getSeoForPath } from "@/lib/seo";
import { DEFAULT_TITLE, DEFAULT_DESCRIPTION, DEFAULT_OG_IMAGE } from "@/lib/seo-config";
import { siteUrl } from "@/lib/site-config";

/**
 * The public homepage.
 *
 * No `dynamic = "force-dynamic"`, no `searchParams` read here — both force
 * the *entire* route to skip the page cache and render from scratch on every
 * request (reading `searchParams`, `cookies()` or `headers()` anywhere in a
 * route opts the whole thing out of static rendering; there's no partial
 * exemption without PPR, which this app doesn't run). That was previously
 * true of every single visit to `/`, the page with the most traffic on the
 * site, purely to support an admin-only preview mode that is now its own
 * route at `/admin/preview`. `revalidate` below gives the common case back
 * its cache.
 */
export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const showrooms = await getShowrooms();
  const cities = showroomCities(showrooms);
  // "Prestige Tiles & Sanitary in Mangaluru" only when there's a real
  // Mangaluru-area showroom to say it about — this generator has to work
  // before the database is ever seeded, so it falls back to the
  // location-agnostic default rather than asserting a place with nothing
  // behind it.
  const isMangaluruArea = cities.includes("Mangaluru");

  const title = isMangaluruArea
    ? "Prestige | Tiles, Bathware & Sanitaryware in Mangaluru"
    : DEFAULT_TITLE;
  const description = isMangaluruArea
    ? `Premium tiles, surfaces, bathware, sanitaryware, faucets and showers from the world's leading brands — displayed at full scale across our showrooms in ${cities.join(", ")}.`
    : DEFAULT_DESCRIPTION;

  const base: Metadata = {
    title: { absolute: title },
    description,
    alternates: { canonical: siteUrl },
    openGraph: {
      type: "website",
      url: siteUrl,
      title,
      description,
      images: [{ url: DEFAULT_OG_IMAGE }],
    },
    twitter: { card: "summary_large_image", title, description, images: [DEFAULT_OG_IMAGE] },
  };

  return applySeo(base, await getSeoForPath("/"), "/");
}

export default async function HomePage() {
  const hero = await getPublishedHomepageHero();
  const featuredProducts = await getCatalogProducts({ limit: 12 });

  return (
    <main className="min-h-screen bg-white">
      <Hero data={hero} />
      <Collections />
      <FeaturedProductsSection products={featuredProducts} />
      <StatsSection />
      <ApplicationsSection />
      <AboutEditorial data={hero} />
      <WhyChooseUs />
      <ShowroomsSection />
      <LocalGuides />
      <Testimonials />
      <CtaSection />
    </main>
  );
}
