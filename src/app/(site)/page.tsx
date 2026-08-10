import { Hero } from "@/components/site/home/Hero";
import { Collections } from "@/components/site/home/Collections";
import { FeaturedProductsSection } from "@/components/site/home/FeaturedProductsSection";
import { StatsSection } from "@/components/site/home/StatsSection";
import { ApplicationsSection } from "@/components/site/home/ApplicationsSection";
import { AboutEditorial } from "@/components/site/home/AboutEditorial";
import { WhyChooseUs } from "@/components/site/home/WhyChooseUs";
import { Testimonials } from "@/components/site/home/Testimonials";
import { ShowroomsSection } from "@/components/site/home/ShowroomsSection";
import { CtaSection } from "@/components/site/home/CtaSection";
import { getPublishedHomepageHero, getHomepageDraft } from "@/app/admin/(dashboard)/content/homepage/actions";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ preview?: string }>;
}) {
  const { preview } = await searchParams;

  let hero;
  if (preview === "1") {
    const session = await auth();
    hero = session?.user ? await getHomepageDraft() : await getPublishedHomepageHero();
  } else {
    hero = await getPublishedHomepageHero();
  }

  return (
    <main className="min-h-screen bg-white">
      {preview === "1" && (
        <div className="fixed inset-x-0 top-0 z-[100] bg-accent py-1.5 text-center text-xs font-bold text-ink">
          Previewing draft homepage — not visible to the public
        </div>
      )}
      <Hero data={hero} />
      <Collections />
      <FeaturedProductsSection />
      <StatsSection />
      <ApplicationsSection />
      <AboutEditorial data={hero} />
      <WhyChooseUs />
      <ShowroomsSection />
      <Testimonials />
      <CtaSection />
    </main>
  );
}


