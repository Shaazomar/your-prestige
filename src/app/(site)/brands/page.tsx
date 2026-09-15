import type { Metadata } from "next";
import { PageHero } from "@/components/site/PageHero";
import { Container } from "@/components/ui/Container";
import { getBrands, getBrandCategories } from "@/lib/brands";
import { Reveal } from "@/components/motion/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ButtonLink } from "@/components/ui/Button";
import { ArrowUpRight } from "lucide-react";
import { BrandsExplorer } from "@/components/site/brands/BrandsExplorer";

export const metadata: Metadata = {
  title: "Explore Our Collections",
  description:
    "Authorised partners for premium Indian and international brands — Jaquar, Artize, Essco and more, at Your Prestige, Mangaluru.",
};

export const revalidate = 600;

export default async function BrandsPage() {
  const brands = await getBrands();

  const withProducts = brands.filter((b) => b.productCount > 0);
  const categoryLists = await Promise.all(withProducts.map((b) => getBrandCategories(b.slug)));
  const categoryNamesBySlug = Object.fromEntries(
    withProducts.map((b, i) => [b.slug, categoryLists[i].map((c) => c.name)])
  );

  return (
    <>
      <PageHero
        eyebrow="Our Partners"
        title="Explore Our Collections"
        description="Authorised partners — not resellers — for every house on this wall, with exclusive collections for coastal Karnataka."
      />

      <section className="bg-ivory py-24 md:py-32">
        <Container size="wide">
          <BrandsExplorer brands={brands} categoryNamesBySlug={categoryNamesBySlug} />
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
