import { Hero } from "@/components/site/home/Hero";
import { Collections } from "@/components/site/home/Collections";
import { BrandWall } from "@/components/site/home/BrandWall";
import { AboutEditorial } from "@/components/site/home/AboutEditorial";
import { Stats } from "@/components/site/home/Stats";
import { GalleryPreview } from "@/components/site/home/GalleryPreview";
import { Testimonials } from "@/components/site/home/Testimonials";
import { ShowroomsSection } from "@/components/site/home/ShowroomsSection";
import { getPublishedHomepageHero, getHomepageDraft } from "@/app/admin/(dashboard)/content/homepage/actions";
import { auth } from "@/lib/auth";

export const revalidate = 60;

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
    <>
      {preview === "1" && (
        <div className="fixed inset-x-0 top-0 z-[100] bg-gold py-1.5 text-center text-xs font-medium text-ivory">
          Previewing draft homepage — not visible to the public
        </div>
      )}
      <Hero data={hero} />
      <Collections />
      <BrandWall />
      <AboutEditorial />
      <Stats />
      <ShowroomsSection />
      <GalleryPreview />
      <Testimonials />
    </>
  );
}
