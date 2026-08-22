import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/motion/Reveal";
import { ButtonLink } from "@/components/ui/Button";
import { ShowroomsExplorer } from "@/components/site/showrooms/ShowroomsExplorer";
import { getShowrooms } from "@/lib/showrooms";
import { getBusiness } from "@/lib/business";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const showrooms = await getShowrooms();
  const cities = Array.from(
    new Set(
      showrooms.map((s) => {
        const c = s.city.toLowerCase();
        if (c === "mangaluru" || c === "puttur" || c === "moodbidri") return "manglore";
        return s.city;
      })
    )
  ).join(", ");
  return {
    title: "Our Showrooms",
    description: `Visit any of our ${showrooms.length} showrooms across ${cities}. Full tile and sanitaryware displays, design consultation and directions.`,
    alternates: { canonical: "/showrooms" },
  };
}

export default async function ShowroomsPage() {
  const [showrooms, business] = await Promise.all([getShowrooms(), getBusiness()]);
  const cities = Array.from(
    new Set(
      showrooms.map((s) => {
        const c = s.city.toLowerCase();
        if (c === "mangaluru" || c === "puttur" || c === "moodbidri") return "manglore";
        return s.city;
      })
    )
  );

  return (
    <>
      <PageHero
        eyebrow={`${showrooms.length} Showrooms · ${cities.join(" · ")}`}
        title="Come stand in front of it."
        description="Photographs only go so far. Walk our floors, feel the finishes, and let a consultant map your project — across coastal Karnataka."
      />

      <section className="bg-ivory py-20 md:py-28">
        <Container size="wide">
          {showrooms.length > 0 ? (
            <ShowroomsExplorer showrooms={showrooms} />
          ) : (
            <p className="rounded-3xl border border-dashed hairline py-20 text-center text-slate-warm">
              Showroom details are being updated. Please call {business.phone}.
            </p>
          )}
        </Container>
      </section>

      <section className="border-t hairline bg-porcelain py-24 md:py-32">
        <Container className="text-center">
          <SectionHeading
            eyebrow="Plan your visit"
            title="Reserve a private consultation"
            description="Tell us which showroom suits you and what you're building — we'll have the right consultant and the right samples ready."
            align="center"
          />
          <Reveal delay={0.3}>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <ButtonLink href="/book-visit" variant="primary" size="lg">
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
