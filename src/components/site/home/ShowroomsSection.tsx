import { ArrowUpRight, Store } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/motion/Reveal";
import { ButtonLink } from "@/components/ui/Button";
import { ShowroomsExplorer } from "@/components/site/showrooms/ShowroomsExplorer";
import { getShowrooms } from "@/lib/showrooms";

/**
 * Homepage showroom section — the primary conversion surface.
 * Reuses ShowroomsExplorer so nearest-showroom detection, city filtering
 * and the four CTAs behave identically to the /showrooms page.
 */
export async function ShowroomsSection() {
  const showrooms = await getShowrooms();
  if (showrooms.length === 0) return null;

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
    <section className="bg-ivory py-28 md:py-40">
      <Container size="wide">
        <div className="mb-14 flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <SectionHeading
            eyebrow={`Visit Our Showrooms · ${cities.join(" · ")}`}
            title="Five floors worth walking."
            description="Photographs flatten a finish. Stand in front of it, run a hand across it, see it under real light — then decide."
          />
          <Reveal delay={0.3} className="shrink-0">
            <ButtonLink href="/showrooms" variant="outline" size="lg">
              <Store className="h-4.5 w-4.5" />
              All {showrooms.length} Showrooms
              <ArrowUpRight className="h-5 w-5" />
            </ButtonLink>
          </Reveal>
        </div>

        <ShowroomsExplorer showrooms={showrooms} />
      </Container>
    </section>
  );
}
