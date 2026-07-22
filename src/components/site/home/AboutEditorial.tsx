import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/motion/Reveal";
import { TextReveal } from "@/components/motion/TextReveal";
import { Parallax } from "@/components/motion/Parallax";
import { ButtonLink } from "@/components/ui/Button";

export function AboutEditorial() {
  return (
    <section className="bg-ivory py-28 md:py-40">
      <Container size="wide">
        <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-24">
          {/* Imagery — layered editorial composition */}
          <div className="relative">
            <Parallax speed={0.08} className="overflow-hidden rounded-3xl">
              <div className="relative aspect-[4/5]">
                <Image
                  src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=1600&auto=format&fit=crop"
                  alt="Your Prestige showroom interior with curated tile displays"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
            </Parallax>
            <Reveal delay={0.3} direction="left" className="absolute -bottom-10 -right-4 hidden w-64 md:block lg:-right-10">
              <div className="overflow-hidden rounded-2xl shadow-float">
                <div className="relative aspect-square">
                  <Image
                    src="https://images.unsplash.com/photo-1615873968403-89e068629265?q=80&w=800&auto=format&fit=crop"
                    alt="Marble surface detail"
                    fill
                    sizes="256px"
                    className="object-cover"
                  />
                </div>
              </div>
            </Reveal>
            {/* Floating stat card */}
            <Reveal delay={0.5} direction="up" className="absolute -left-4 top-10 lg:-left-8">
              <div className="glass rounded-2xl px-6 py-5 shadow-soft">
                <p className="text-3xl font-bold tracking-tight text-ink">15+</p>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-warm">Years of Craft</p>
              </div>
            </Reveal>
          </div>

          {/* Copy */}
          <div>
            <Reveal direction="none">
              <p className="text-eyebrow mb-6 text-gold">The Prestige Story</p>
            </Reveal>
            <TextReveal
              text="Not a tile shop. A destination for design."
              className="text-display-md text-ink"
            />
            <Reveal delay={0.2}>
              <p className="mt-8 text-lg leading-relaxed text-slate-warm">
                For over fifteen years, Your Prestige has shaped the finest homes,
                hotels and landmarks of coastal Karnataka. Our Mangaluru showroom
                is an immersive gallery — full-scale bathroom sanctuaries,
                book-matched marble walls, and consultants who think like designers,
                not salespeople.
              </p>
            </Reveal>
            <Reveal delay={0.35}>
              <p className="mt-5 text-lg leading-relaxed text-slate-warm">
                Every surface we curate is chosen for one reason:{" "}
                <span className="serif-accent text-xl text-ink">
                  it deserves to be lived with.
                </span>
              </p>
            </Reveal>
            <Reveal delay={0.5}>
              <div className="mt-10">
                <ButtonLink href="/about" variant="outline" size="lg">
                  Our Story
                  <ArrowUpRight className="h-5 w-5 transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </ButtonLink>
              </div>
            </Reveal>
          </div>
        </div>
      </Container>
    </section>
  );
}
