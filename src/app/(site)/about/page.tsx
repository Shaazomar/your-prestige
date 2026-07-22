import type { Metadata } from "next";
import Image from "next/image";
import { PageHero } from "@/components/site/PageHero";
import { Container } from "@/components/ui/Container";
import { Reveal, RevealStagger, RevealItem } from "@/components/motion/Reveal";
import { Parallax } from "@/components/motion/Parallax";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Stats } from "@/components/site/home/Stats";
import { ButtonLink } from "@/components/ui/Button";
import { ArrowUpRight } from "lucide-react";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Fifteen years of shaping coastal Karnataka's finest spaces. Discover the story behind Your Prestige — Mangaluru's destination for luxury tiles and sanitaryware.",
};

const values = [
  {
    title: "Curation over inventory",
    body: "We don't stock everything — we select the exceptional. Every collection earns its place on our floor.",
  },
  {
    title: "Design-first consultation",
    body: "Our consultants think like designers. You leave with a vision, not just a product code.",
  },
  {
    title: "Uncompromising delivery",
    body: "Zero-defect handling, staged site deliveries and installation supervision on critical projects.",
  },
] as const;

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="The Prestige Story"
        title="Fifteen years of shaping beautiful spaces."
        description="From a single storefront to coastal Karnataka's most trusted destination for luxury surfaces — this is how we built Your Prestige."
      />

      {/* Editorial narrative */}
      <section className="bg-ivory py-24 md:py-36">
        <Container size="wide">
          <div className="grid items-start gap-14 lg:grid-cols-2 lg:gap-24">
            <Parallax speed={0.06} className="overflow-hidden rounded-3xl">
              <div className="relative aspect-[4/5]">
                <Image
                  src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=1600&auto=format&fit=crop"
                  alt="A live bathroom suite inside the Your Prestige showroom"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
            </Parallax>
            <div className="lg:pt-12">
              <SectionHeading
                eyebrow="Our Philosophy"
                title="Surfaces are the soul of a space"
              />
              <Reveal delay={0.2}>
                <p className="mt-8 text-lg leading-relaxed text-slate-warm">
                  A floor is walked on for decades. A bathroom is the first room of every
                  morning. We believe these surfaces deserve the same obsession a couturier
                  gives a garment — which is why every slab, every fitting and every finish
                  in our showroom is chosen, not merely stocked.
                </p>
              </Reveal>
              <Reveal delay={0.3}>
                <p className="mt-5 text-lg leading-relaxed text-slate-warm">
                  Today, Your Prestige partners with 40+ of the world&apos;s finest houses and
                  has delivered over 2,400 projects — homes, villas, hotels and landmarks
                  across Dakshina Kannada and beyond.
                </p>
              </Reveal>
              <RevealStagger className="mt-12 space-y-8" stagger={0.12}>
                {values.map((v, i) => (
                  <RevealItem key={v.title} className="flex gap-6">
                    <span className="serif-accent text-3xl text-gold">0{i + 1}</span>
                    <div>
                      <h3 className="text-xl font-semibold text-ink">{v.title}</h3>
                      <p className="mt-2 leading-relaxed text-slate-warm">{v.body}</p>
                    </div>
                  </RevealItem>
                ))}
              </RevealStagger>
            </div>
          </div>
        </Container>
      </section>

      <Stats />

      {/* CTA */}
      <section className="bg-porcelain py-24 md:py-32">
        <Container className="text-center">
          <SectionHeading
            eyebrow="Experience it yourself"
            title="The showroom tells the story better than we can"
            align="center"
          />
          <Reveal delay={0.3}>
            <div className="mt-10 flex justify-center">
              <ButtonLink href="/book-visit" variant="gold" size="lg">
                Book a Private Visit
                <ArrowUpRight className="h-5 w-5" />
              </ButtonLink>
            </div>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
