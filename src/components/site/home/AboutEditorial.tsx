import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/motion/Reveal";
import { TextReveal } from "@/components/motion/TextReveal";
import { Parallax } from "@/components/motion/Parallax";
import { ButtonLink } from "@/components/ui/Button";
import type { HomepageHeroInput } from "@/app/admin/(dashboard)/content/homepage/schema";

export function AboutEditorial({ data }: { data: HomepageHeroInput }) {
  const eyebrow = data?.storyEyebrow || "The Prestige Story";
  const title = data?.storyTitle || "Not a tile shop. A destination for design.";
  const text1 =
    data?.storyText1 ||
    "For over fifteen years, Your Prestige has shaped the finest homes, hotels and landmarks of coastal Karnataka. Our Mangaluru showroom is an immersive gallery — full-scale bathroom sanctuaries, book-matched marble walls, and consultants who think like designers, not salespeople.";
  const text2 =
    data?.storyText2 || "Every surface we curate is chosen for one reason: it deserves to be lived with.";
  const mainImage =
    data?.storyMainImage ||
    "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=1600&auto=format&fit=crop";
  const detailImage =
    data?.storyDetailImage ||
    "https://images.unsplash.com/photo-1615873968403-89e068629265?q=80&w=800&auto=format&fit=crop";
  const statNumber = data?.storyStatNumber || "15+";
  const statLabel = data?.storyStatLabel || "Years of Craft";
  const ctaLabel = data?.storyCtaLabel || "Our Story";
  const ctaHref = data?.storyCtaHref || "/about";

  const renderParagraphWithHighlight = (text: string) => {
    const parts = text.split(":");
    if (parts.length > 1) {
      return (
        <>
          {parts[0]}:{" "}
          <span className="serif-accent text-xl text-ink">
            {parts.slice(1).join(":")}
          </span>
        </>
      );
    }
    return text;
  };

  return (
    <section className="bg-ivory py-28 md:py-40">
      <Container size="wide">
        <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-24">
          {/* Imagery — layered editorial composition */}
          <div className="relative">
            <Parallax speed={0.08} className="overflow-hidden rounded-3xl">
              <div className="relative aspect-[4/5]">
                <Image
                  src={mainImage}
                  alt="Curated showroom display"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
            </Parallax>
            {detailImage && (
              <Reveal delay={0.3} direction="left" className="absolute -bottom-10 -right-4 hidden w-64 md:block lg:-right-10">
                <div className="overflow-hidden rounded-2xl shadow-float">
                  <div className="relative aspect-square">
                    <Image
                      src={detailImage}
                      alt="Curated surface detail"
                      fill
                      sizes="256px"
                      className="object-cover"
                    />
                  </div>
                </div>
              </Reveal>
            )}
            {/* Floating stat card */}
            {statNumber && statLabel && (
              <Reveal delay={0.5} direction="up" className="absolute -left-4 top-10 lg:-left-8">
                <div className="glass-light rounded-2xl px-6 py-5 shadow-soft">
                  <p className="text-3xl font-bold tracking-tight text-ink">{statNumber}</p>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-warm">{statLabel}</p>
                </div>
              </Reveal>
            )}
          </div>

          {/* Copy */}
          <div>
            {eyebrow && (
              <Reveal direction="none">
                <p className="text-eyebrow mb-6 text-gold">{eyebrow}</p>
              </Reveal>
            )}
            {title && (
              <TextReveal
                text={title}
                className="text-display-md text-ink"
              />
            )}
            {text1 && (
              <Reveal delay={0.2}>
                <p className="mt-8 text-lg leading-relaxed text-slate-warm">
                  {text1}
                </p>
              </Reveal>
            )}
            {text2 && (
              <Reveal delay={0.35}>
                <p className="mt-5 text-lg leading-relaxed text-slate-warm">
                  {renderParagraphWithHighlight(text2)}
                </p>
              </Reveal>
            )}
            {ctaLabel && ctaHref && (
              <Reveal delay={0.5}>
                <div className="mt-10">
                  <ButtonLink href={ctaHref} variant="outline" size="lg">
                    {ctaLabel}
                    <ArrowUpRight className="h-5 w-5 transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </ButtonLink>
                </div>
              </Reveal>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}
