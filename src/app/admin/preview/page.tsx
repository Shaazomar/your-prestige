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
import { getPublishedHomepageHero, getHomepageDraft } from "@/app/admin/(dashboard)/content/homepage/actions";
import { getCatalogProducts } from "@/lib/products";
import { auth } from "@/lib/auth";

/**
 * Draft-homepage preview, split out of the public `/` route.
 *
 * `/` used to read `searchParams.preview` itself and call `auth()` when it was
 * set. In the App Router, reading `searchParams` or `cookies()`/`headers()`
 * (which `auth()` needs) forces the *entire* route to render dynamically —
 * there's no partial opt-in without PPR — so every real visitor's homepage
 * request was skipping the page cache and hitting the database from scratch,
 * every time. Moving the one code path that actually needs request-time data
 * to its own route lets the public homepage go back to being a normal,
 * revalidated page.
 *
 * This route requires a session itself (`getHomepageDraft` calls
 * `requirePermission`), and `/admin/*` requires one anyway per
 * `src/middleware.ts`; `robots: { index: false }` here is belt-and-braces —
 * `/admin/` is already disallowed in `robots.ts`.
 */

export const metadata: Metadata = {
  title: "Homepage Preview — Prestige Admin",
  robots: { index: false, follow: false },
};

export default async function HomepagePreview() {
  const session = await auth();
  const hero = session?.user ? await getHomepageDraft() : await getPublishedHomepageHero();
  const featuredProducts = await getCatalogProducts({ limit: 12 });

  return (
    <main className="min-h-screen bg-white">
      <div className="fixed inset-x-0 top-0 z-[100] bg-accent py-1.5 text-center text-xs font-bold text-ink">
        Previewing draft homepage — not visible to the public
      </div>
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
