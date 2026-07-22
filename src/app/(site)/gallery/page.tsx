import type { Metadata } from "next";
import Image from "next/image";
import { PageHero } from "@/components/site/PageHero";
import { Container } from "@/components/ui/Container";
import { galleryImages } from "@/lib/demo-content";
import { RevealStagger, RevealItem } from "@/components/motion/Reveal";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Gallery",
  description:
    "A living archive of homes, hotels and sanctuaries finished with Your Prestige surfaces across Mangaluru and coastal Karnataka.",
};

export default function GalleryPage() {
  // Double the set for a fuller wall until CMS media takes over
  const wall = [...galleryImages, ...galleryImages.slice(0, 4)];

  return (
    <>
      <PageHero
        eyebrow="The Gallery"
        title="Every image, a finished promise."
        description="Real spaces, real projects — photographed as delivered."
      />
      <section className="bg-ivory py-20 md:py-28">
        <Container size="wide">
          <RevealStagger
            className="columns-2 gap-5 md:columns-3 lg:columns-4 [&>*]:mb-5"
            stagger={0.06}
          >
            {wall.map((img, i) => (
              <RevealItem key={`${img.src}-${i}`}>
                <div className="group relative overflow-hidden rounded-2xl">
                  <div className={cn("relative", img.tall ? "aspect-[3/4]" : "aspect-square")}>
                    <Image
                      src={img.src}
                      alt={img.alt}
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      className="object-cover transition-transform duration-[1.4s] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-108"
                    />
                    <div className="absolute inset-0 flex items-end bg-gradient-to-t from-ink/70 to-transparent p-5 opacity-0 transition-opacity duration-700 group-hover:opacity-100">
                      <p className="text-sm text-ivory/90">{img.alt}</p>
                    </div>
                  </div>
                </div>
              </RevealItem>
            ))}
          </RevealStagger>
        </Container>
      </section>
    </>
  );
}
