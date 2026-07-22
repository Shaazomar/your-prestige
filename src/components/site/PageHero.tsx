import { Container } from "@/components/ui/Container";
import { TextReveal } from "@/components/motion/TextReveal";
import { Reveal } from "@/components/motion/Reveal";

interface PageHeroProps {
  eyebrow: string;
  title: string;
  description?: string;
}

/** Consistent dark editorial opener for interior pages. */
export function PageHero({ eyebrow, title, description }: PageHeroProps) {
  return (
    <section className="bg-ink pb-20 pt-40 text-ivory md:pb-28 md:pt-52">
      <Container size="wide">
        <Reveal direction="none" duration={0.7}>
          <p className="text-eyebrow mb-6 text-gold">{eyebrow}</p>
        </Reveal>
        <TextReveal as="h1" text={title} className="text-display-lg max-w-4xl" />
        {description && (
          <Reveal delay={0.3}>
            <p className="mt-7 max-w-2xl text-lg leading-relaxed text-ivory/60">
              {description}
            </p>
          </Reveal>
        )}
      </Container>
    </section>
  );
}
