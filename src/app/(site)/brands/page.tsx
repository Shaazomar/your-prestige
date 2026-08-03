import type { Metadata } from "next";
import { PageHero } from "@/components/site/PageHero";
import { Container } from "@/components/ui/Container";
import Link from "next/link";
import { getBrands } from "@/lib/brands";
import { RevealStagger, RevealItem, Reveal } from "@/components/motion/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ButtonLink } from "@/components/ui/Button";
import { ArrowUpRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Brands",
  description:
    "Authorised partners for 40+ premium Indian and international brands — Kajaria, Kohler, Grohe, Jaquar, Duravit, Hansgrohe and more, at Your Prestige, Mangaluru.",
};

export const revalidate = 600;

export default async function BrandsPage() {
  const brands = await getBrands();

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
              <RevealItem key={brand.slug}>
                {/* Brands with published products link to their catalogue
                    library; the rest stay as plain marks, since a link to an
                    empty range is worse than no link. */}
                {brand.productCount > 0 ? (
                  <Link
                    href={`/brands/${brand.slug}`}
                    className="group flex aspect-[4/3] flex-col items-center justify-center gap-1.5 bg-ivory transition-colors duration-700 hover:bg-ink"
                  >
                    <span className="text-xl font-semibold tracking-tight text-slate-warm transition-colors duration-700 group-hover:text-ivory md:text-2xl">
                      {brand.name}
                    </span>
                    <span className="text-xs text-ink/35 transition-colors duration-700 group-hover:text-ivory/50">
                      {brand.productCount} piece{brand.productCount === 1 ? "" : "s"}
                    </span>
                  </Link>
                ) : (
                  <div className="group flex aspect-[4/3] items-center justify-center bg-ivory transition-colors duration-700 hover:bg-ink">
                    <span className="text-xl font-semibold tracking-tight text-slate-warm transition-colors duration-700 group-hover:text-ivory md:text-2xl">
                      {brand.name}
                    </span>
                  </div>
                )}
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
              <ButtonLink href="/contact" variant="primary" size="lg">
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
