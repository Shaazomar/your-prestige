import { Star } from "lucide-react";
import { testimonials } from "@/lib/demo-content";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { RevealStagger, RevealItem } from "@/components/motion/Reveal";

export function Testimonials() {
  return (
    <section className="bg-ivory py-28 md:py-40">
      <Container size="wide">
        <SectionHeading
          eyebrow="Voices of Prestige"
          title="Trusted by homeowners, architects & builders"
          align="center"
          className="mb-16 md:mb-20"
        />

        <RevealStagger className="grid gap-6 md:grid-cols-2 lg:grid-cols-4" stagger={0.12}>
          {testimonials.map((t, i) => (
            <RevealItem key={t.name} className={i % 2 === 1 ? "lg:mt-12" : ""}>
              <figure className="flex h-full flex-col justify-between rounded-3xl border hairline bg-white p-8 shadow-soft transition-all duration-700 hover:-translate-y-2 hover:shadow-float">
                <div>
                  <div className="mb-5 flex gap-1" aria-label={`${t.rating} star rating`}>
                    {Array.from({ length: t.rating }).map((_, s) => (
                      <Star key={s} className="h-4 w-4 fill-gold text-gold" />
                    ))}
                  </div>
                  <blockquote className="text-[0.95rem] leading-relaxed text-slate-warm">
                    &ldquo;{t.quote}&rdquo;
                  </blockquote>
                </div>
                <figcaption className="mt-8 border-t hairline pt-5">
                  <p className="font-semibold text-ink">{t.name}</p>
                  <p className="mt-0.5 text-sm text-stone-400">{t.role}</p>
                </figcaption>
              </figure>
            </RevealItem>
          ))}
        </RevealStagger>
      </Container>
    </section>
  );
}
