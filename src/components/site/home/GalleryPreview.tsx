import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { galleryImages } from "@/lib/demo-content";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { RevealStagger, RevealItem, Reveal } from "@/components/motion/Reveal";
import { ButtonLink } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export function GalleryPreview() {
  return (
    <section className="bg-porcelain py-28 md:py-40">
      <Container size="wide">
        <div className="mb-16 flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <SectionHeading
            eyebrow="The Gallery"
            title="Spaces we've shaped"
            description="A living archive of homes, hotels and sanctuaries finished with Prestige surfaces."
          />
          <Reveal delay={0.3} className="shrink-0">
            <ButtonLink href="/gallery" variant="outline" size="lg">
              View Full Gallery
              <ArrowUpRight className="h-5 w-5" />
            </ButtonLink>
          </Reveal>
        </div>

        <RevealStagger
          className="columns-2 gap-5 md:columns-3 lg:columns-4 [&>*]:mb-5"
          stagger={0.08}
        >
          {galleryImages.map((img) => (
            <RevealItem key={img.src}>
              <div className="group relative overflow-hidden rounded-2xl">
                <div className={cn("relative", img.tall ? "aspect-[3/4]" : "aspect-square")}>
                  <Image
                    src={img.src}
                    alt={img.alt}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover transition-transform duration-[1.4s] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-108"
                  />
                  <div className="absolute inset-0 bg-ink/0 transition-colors duration-700 group-hover:bg-ink/25" />
                </div>
              </div>
            </RevealItem>
          ))}
        </RevealStagger>
      </Container>
    </section>
  );
}
