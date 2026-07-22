import type { Metadata } from "next";
import { PageHero } from "@/components/site/PageHero";
import { Container } from "@/components/ui/Container";
import { ProductCard } from "@/components/site/ProductCard";
import { products } from "@/lib/demo-content";
import { RevealStagger, RevealItem, Reveal } from "@/components/motion/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ButtonLink } from "@/components/ui/Button";
import { ArrowUpRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Collections",
  description:
    "Explore 600+ premium tiles, luxury sanitaryware and designer picks from 40+ world-class brands at Your Prestige, Mangaluru.",
};

export default function ProductsPage() {
  return (
    <>
      <PageHero
        eyebrow="The Collections"
        title="A catalogue curated like a gallery."
        description="Premium tiles, sanctuary bathrooms and designer statements — browse the highlights, then experience them full-scale in our showroom."
      />

      <section className="bg-ivory py-24 md:py-32">
        <Container size="wide">
          <RevealStagger className="grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3" stagger={0.1}>
            {products.map((p) => (
              <RevealItem key={p.slug}>
                <ProductCard product={p} />
              </RevealItem>
            ))}
          </RevealStagger>
        </Container>
      </section>

      <section className="border-t hairline bg-porcelain py-24 md:py-32">
        <Container className="text-center">
          <SectionHeading
            eyebrow="Beyond the catalogue"
            title="600+ designs live on our showroom floor"
            description="The website shows the highlights. The showroom shows everything — full slabs, live bathroom suites and material libraries."
            align="center"
          />
          <Reveal delay={0.3}>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <ButtonLink href="/book-visit" variant="gold" size="lg">
                Book a Visit
                <ArrowUpRight className="h-5 w-5" />
              </ButtonLink>
              <ButtonLink href="/request-quote" variant="outline" size="lg">
                Request a Quote
              </ButtonLink>
            </div>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
