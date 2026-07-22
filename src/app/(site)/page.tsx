import { Hero } from "@/components/site/home/Hero";
import { Collections } from "@/components/site/home/Collections";
import { BrandWall } from "@/components/site/home/BrandWall";
import { AboutEditorial } from "@/components/site/home/AboutEditorial";
import { Stats } from "@/components/site/home/Stats";
import { GalleryPreview } from "@/components/site/home/GalleryPreview";
import { Testimonials } from "@/components/site/home/Testimonials";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Collections />
      <BrandWall />
      <AboutEditorial />
      <Stats />
      <GalleryPreview />
      <Testimonials />
    </>
  );
}
