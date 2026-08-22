import type { Metadata } from "next";
import { CatalogueHero } from "@/components/site/catalog/CatalogueHero";
import DriftWall from "@/components/ui/DriftWall";
import { getGalleryItems } from "@/lib/gallery";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "The Gallery",
  description: "Real spaces, real projects — photographed as delivered across coastal Karnataka.",
  alternates: { canonical: "/gallery" },
};

export default async function GalleryPage() {
  const items = await getGalleryItems();

  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <CatalogueHero
        eyebrow="THE GALLERY"
        title={"Every image,\na finished promise."}
        description="Real spaces, real projects — photographed as delivered across coastal Karnataka."
        heroImage="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=1600&auto=format&fit=crop"
      />

      {/* Full-width CMS-Connected Drift Wall Section on White Background */}
      <section className="relative w-full h-[700px] md:h-[820px] bg-white overflow-hidden py-4">
        <DriftWall
          items={items}
          columns={5}
          tileWidth={320}
          tileHeight={200}
          gap={24}
          tilt={14}
          turn={-12}
          perspective={1200}
          depth={100}
          speed={38}
          direction="up"
          variance={0.45}
          parallax={0.6}
          lift={64}
          fade={0.25}
          dim={0.75}
          overlayColor="#ffffff"
        />
      </section>
    </main>
  );
}
