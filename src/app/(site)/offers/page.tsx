import type { Metadata } from "next";
import { PageHero } from "@/components/site/PageHero";
import { Container } from "@/components/ui/Container";
import { Reveal, RevealStagger, RevealItem } from "@/components/motion/Reveal";
import { ButtonLink } from "@/components/ui/Button";
import { ArrowUpRight, Award } from "lucide-react";

export const metadata: Metadata = {
  title: "Offers",
  description:
    "Seasonal privileges and project-scale advantages at Your Prestige, Mangaluru — crafted for those building something exceptional.",
};

const offers = [
  {
    title: "The New Home Privilege",
    body: "Complimentary design consultation + site measurement for full-home projects, with staged delivery planning included.",
    tag: "For Homeowners",
  },
  {
    title: "Trade Partner Advantage",
    body: "Registered architects and builders unlock priority sampling, dedicated account management and project-scale pricing.",
    tag: "For Professionals",
  },
  {
    title: "Bathroom Sanctuary Package",
    body: "Curated bathroom suites — tiles, sanitary and fittings composed together — with preferential package pricing.",
    tag: "Limited Season",
  },
] as const;

export default function OffersPage() {
  return (
    <>
      <PageHero
        eyebrow="Privileges"
        title="Quiet advantages, never discounts."
        description="Luxury isn't about slashing prices — it's about elevating what you receive. These privileges are updated seasonally."
      />
      <section className="bg-ivory py-20 md:py-28">
        <Container size="wide">
          <RevealStagger className="grid gap-6 lg:grid-cols-3" stagger={0.12}>
            {offers.map((o) => (
              <RevealItem key={o.title}>
                <article className="flex h-full flex-col justify-between rounded-3xl border hairline bg-white p-10 shadow-soft transition-all duration-700 hover:-translate-y-2 hover:shadow-float">
                  <div>
                    <span className="mb-6 inline-flex items-center gap-2 rounded-full bg-gold/10 px-4 py-1.5 text-xs font-semibold text-gold-deep">
                      <Award className="h-3.5 w-3.5" />
                      {o.tag}
                    </span>
                    <h2 className="text-2xl font-semibold tracking-tight text-ink">
                      {o.title}
                    </h2>
                    <p className="mt-4 leading-relaxed text-slate-warm">{o.body}</p>
                  </div>
                  <div className="mt-8">
                    <ButtonLink href="/contact" variant="outline" size="md">
                      Claim Privilege
                      <ArrowUpRight className="h-4 w-4" />
                    </ButtonLink>
                  </div>
                </article>
              </RevealItem>
            ))}
          </RevealStagger>
          <Reveal delay={0.2}>
            <p className="mt-12 text-center text-sm text-stone-400">
              Privileges are subject to project qualification. Speak to a consultant for details.
            </p>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
