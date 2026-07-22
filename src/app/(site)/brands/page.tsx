import type { Metadata } from "next";
import { PageHero } from "@/components/site/PageHero";
import { Container } from "@/components/ui/Container";
import { brands } from "@/lib/demo-content";
import { RevealStagger, RevealItem, Reveal } from "@/components/motion/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ButtonLink } from "@/components/ui/Button";
import { ArrowUpRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Brands",
  description:
    "Authorised partners for 40+ premium Indian and international brands — Kajaria, Kohler, Grohe, Jaquar, Duravit, Hansgrohe and more, at Your Prestige, Mangaluru.",
};

export default function BrandsPage() {
  return (
    <>
      <PageHero
        eyebrow="Our Partners"
        title="Forty of the world's finest houses."
        description="We are authorised partners — not resellers — for every brand on this wall, with exclusive collections for coastal Karnataka."
      />

      <section className="bg-ivory py-24 md:py-32">
        <Container size="wide">
          <RevealStagger
            className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl border hairline bg-ink/8 md:grid-cols-4"
            stagger={0.05}
          >
            {brands.map((brand) => (
              <RevealItem key={brand}>
                <div className="group flex aspect-[4/3] items-center justify-center bg-ivory transition-colors duration-700 hover:bg-ink">
                  <span className="text-xl font-semibold tracking-tight text-slate-warm transition-colors duration-700 group-hover:text-ivory md:text-2xl">
                    {brand}
                  </span>
                </div>
              </RevealItem>
            ))}
          </RevealStagger>
        </Container>
      </section>

      <section className="border-t hairline bg-porcelain py-24 md:py-32">
        <Container className="text-center">
          <SectionHeading
            eyebrow="Trade Programme"
            title="Architects & builders: partner with us"
            description="Priority sampling, dedicated account managers and project-scale pricing across every brand we carry."
            align="center"
          />
          <Reveal delay={0.3}>
            <div className="mt-10 flex justify-center">
              <ButtonLink href="/contact" variant="gold" size="lg">
                Register Your Practice
                <ArrowUpRight className="h-5 w-5" />
              </ButtonLink>
            </div>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
