import { Star } from "lucide-react";
import { getPublishedTestimonials } from "@/lib/testimonials";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { RevealStagger, RevealItem } from "@/components/motion/Reveal";

function getInitials(name: string) {
  const cleanName = name.replace(/^(Ar\.|Dr\.|Mr\.|Mrs\.|Ms\.)\s+/i, "");
  const parts = cleanName.split(/\s+/).filter(p => p !== "&" && p.toLowerCase() !== "and");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0] ? parts[0][0].toUpperCase() : "";
}

export async function Testimonials() {
  const testimonialsList = await getPublishedTestimonials();

  return (
    <section className="bg-[#FAF9F6] py-28 md:py-40">
      <Container size="wide">
        <SectionHeading
          eyebrow="Voices of Prestige"
          title="Trusted by homeowners, architects & builders"
          align="center"
          className="mb-16 md:mb-20"
        />

        <RevealStagger className="grid gap-8 md:grid-cols-2 lg:grid-cols-4" stagger={0.12}>
          {testimonialsList.map((t, i) => (
            <RevealItem key={t.name} className={i % 2 === 1 ? "lg:mt-8" : ""}>
              <figure className="relative overflow-hidden flex h-full flex-col justify-between rounded-3xl border border-stone-200/60 bg-white p-8 shadow-[0_8px_30px_rgba(0,0,0,0.02)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(246,198,0,0.08),0_10px_30px_rgba(0,0,0,0.04)] hover:border-gold/30 group">
                {/* Large Background Quote Mark */}
                <span className="absolute -top-6 -right-2 text-[10rem] font-serif leading-none select-none text-stone-100/70 transition-colors duration-500 group-hover:text-gold/5 pointer-events-none">
                  &ldquo;
                </span>

                <div className="relative z-10">
                  <div className="mb-6 flex items-center justify-between">
                    <div className="flex gap-1" aria-label={`${t.rating} star rating`}>
                      {Array.from({ length: t.rating }).map((_, s) => (
                        <Star key={s} className="h-4 w-4 fill-gold text-gold" />
                      ))}
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-stone-500 group-hover:bg-gold/10 group-hover:text-gold transition-colors duration-500">
                      Verified
                    </span>
                  </div>
                  <blockquote className="text-[0.98rem] font-serif italic leading-relaxed text-stone-700 group-hover:text-stone-900 transition-colors duration-300">
                    &ldquo;{t.quote}&rdquo;
                  </blockquote>
                </div>

                <figcaption className="relative z-10 mt-8 border-t border-stone-100 pt-6 flex items-center gap-4">
                  {/* Initials Avatar Badge */}
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-stone-50 text-stone-700 font-serif font-semibold text-sm border border-stone-200/50 group-hover:bg-gold group-hover:text-black group-hover:border-gold transition-all duration-500">
                    {getInitials(t.name)}
                  </div>
                  <div>
                    <p className="font-serif font-bold text-ink leading-tight text-[0.95rem]">{t.name}</p>
                    <p className="mt-1 text-[10px] font-semibold tracking-wider uppercase text-stone-400">{t.role}</p>
                  </div>
                </figcaption>
              </figure>
            </RevealItem>
          ))}
        </RevealStagger>
      </Container>
    </section>
  );
}
