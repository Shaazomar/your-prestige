import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/motion/Reveal";
import { Parallax } from "@/components/motion/Parallax";
import type { AboutPerson } from "@prisma/client";

interface InaugurationSectionProps {
  inauguration?: AboutPerson | null;
}

export function InaugurationSection({ inauguration }: InaugurationSectionProps) {
  // If disabled or missing, don't render section
  if (!inauguration || !inauguration.active) return null;

  const eyebrow = inauguration.eyebrow || "DISTINGUISHED GUEST";
  const title = inauguration.name;
  const designation = inauguration.designation;
  const description =
    inauguration.description ||
    "We are honored to have had our landmark flagship showroom inaugurated by Hon'ble Speaker of the Karnataka Legislative Assembly, U. T. Khader, marking a landmark moment in coastal Karnataka's luxury interior landscape.";
  const imageAlt =
    inauguration.imageAlt || `${title} inaugurating Prestige Tiles`;

  return (
    <section className="relative overflow-hidden bg-porcelain py-24 md:py-36 border-y border-gold/15">
      {/* Decorative subtle ambient background */}
      <div className="pointer-events-none absolute -left-32 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-gold/5 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-0 h-80 w-80 rounded-full bg-slate-warm/5 blur-3xl" />

      <Container size="wide">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Left Column: Photograph */}
          <div className="lg:col-span-6">
            <Parallax speed={0.04} className="group relative">
              {/* Outer frame styling */}
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl bg-slate-100 shadow-2xl transition-all duration-700 hover:shadow-gold/10">
                <Image
                  src={inauguration.image}
                  alt={imageAlt}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 45vw"
                  className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                  quality={92}
                  unoptimized={inauguration.image.startsWith("/uploads")}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60 transition-opacity group-hover:opacity-40" />
              </div>

              {/* Accent corner design element */}
              <div className="absolute -bottom-3 -right-3 -z-10 h-full w-full rounded-3xl border border-gold/25 bg-gold/5 transition-transform duration-500 group-hover:translate-x-1 group-hover:translate-y-1" />
            </Parallax>
          </div>

          {/* Right Column: Editorial Text */}
          <div className="lg:col-span-6 lg:pl-6 space-y-6">
            <Reveal delay={0.1}>
              <div className="inline-flex items-center gap-2 rounded-full bg-gold/10 px-4 py-1.5 border border-gold/25">
                <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-[0.25em] text-gold">
                  {eyebrow}
                </span>
              </div>
            </Reveal>

            <Reveal delay={0.2}>
              <h2 className="text-4xl font-serif font-bold text-ink sm:text-5xl md:text-6xl tracking-tight leading-[1.1]">
                {title}
              </h2>
            </Reveal>

            <Reveal delay={0.3}>
              <p className="text-lg font-medium text-slate-warm/90 md:text-xl border-l-2 border-gold pl-4 py-1 italic">
                {designation}
              </p>
            </Reveal>

            <Reveal delay={0.4}>
              <p className="text-base leading-relaxed text-slate-warm md:text-lg">
                {description}
              </p>
            </Reveal>

            {(inauguration.date || inauguration.location) && (
              <Reveal delay={0.5}>
                <div className="flex flex-wrap gap-4 pt-2 text-xs font-semibold text-slate-warm/70 uppercase tracking-wider">
                  {inauguration.date && (
                    <span className="rounded-xl bg-ivory px-3 py-1.5 border border-slate-warm/15">
                      📅 {inauguration.date}
                    </span>
                  )}
                  {inauguration.location && (
                    <span className="rounded-xl bg-ivory px-3 py-1.5 border border-slate-warm/15">
                      📍 {inauguration.location}
                    </span>
                  )}
                </div>
              </Reveal>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}
