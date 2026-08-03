import type { Metadata } from "next";
import { Star } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Container } from "@/components/ui/Container";
import { testimonials } from "@/lib/demo-content";
import { RevealStagger, RevealItem, Reveal } from "@/components/motion/Reveal";
import { ButtonLink } from "@/components/ui/Button";
import { ArrowUpRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Testimonials",
  description:
    "What homeowners, architects and builders across Mangaluru say about Your Prestige.",
};

export default function TestimonialsPage() {
  return (
    <>
      <PageHero
        eyebrow="Voices of Prestige"
        title="Our reputation, in their words."
        description="Homeowners, architects and builders — the people who trusted us with their most important spaces."
      />
      <section className="bg-ivory py-20 md:py-28">
        <Container size="wide">
          <RevealStagger className="grid gap-6 md:grid-cols-2" stagger={0.1}>
            {testimonials.map((t) => (
              <RevealItem key={t.name}>
                <figure className="flex h-full flex-col justify-between rounded-3xl border hairline bg-white p-10 shadow-soft">
                  <div>
                    <div className="mb-6 flex gap-1" aria-label={`${t.rating} star rating`}>
                      {Array.from({ length: t.rating }).map((_, s) => (
                        <Star key={s} className="h-4 w-4 fill-gold text-gold" />
                      ))}
                    </div>
                    <blockquote className="text-xl leading-relaxed text-ink">
                      &ldquo;{t.quote}&rdquo;
                    </blockquote>
                  </div>
                  <figcaption className="mt-8 border-t hairline pt-6">
                    <p className="font-semibold text-ink">{t.name}</p>
                    <p className="mt-0.5 text-sm text-stone-400">{t.role}</p>
                  </figcaption>
                </figure>
              </RevealItem>
            ))}
          </RevealStagger>

          <Reveal delay={0.2}>
            <div className="mt-16 flex flex-col items-center gap-6 rounded-3xl bg-ink p-12 text-center text-ivory md:p-16">
              <p className="text-eyebrow text-gold">Join them</p>
              <h2 className="text-display-sm max-w-2xl">
                Your project could be our next favourite story.
              </h2>
              <ButtonLink href="/book-visit" variant="primary" size="lg">
                Start with a Visit
                <ArrowUpRight className="h-5 w-5" />
              </ButtonLink>
            </div>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
