import { business } from "@/lib/site-config";
import { Container } from "@/components/ui/Container";
import { Counter } from "@/components/motion/Counter";
import { Reveal, RevealStagger, RevealItem } from "@/components/motion/Reveal";

const stats = [
  { value: business.stats.years, suffix: "+", label: "Years of Excellence" },
  { value: business.stats.projects, suffix: "+", label: "Projects Delivered" },
  { value: business.stats.customers, suffix: "+", label: "Happy Customers" },
  { value: business.stats.brands, suffix: "+", label: "Premium Brands" },
];

export function Stats() {
  return (
    <section className="bg-ink py-24 text-ivory md:py-32">
      <Container size="wide">
        <Reveal direction="none">
          <p className="text-eyebrow mb-16 text-center text-gold">Why Your Prestige</p>
        </Reveal>
        <RevealStagger className="grid grid-cols-2 gap-x-6 gap-y-14 lg:grid-cols-4" stagger={0.12}>
          {stats.map((s) => (
            <RevealItem key={s.label} className="text-center">
              <p className="text-5xl font-bold tracking-tight md:text-7xl">
                <Counter value={s.value} suffix={s.suffix} />
              </p>
              <p className="mt-4 text-sm uppercase tracking-[0.24em] text-ivory/40">
                {s.label}
              </p>
            </RevealItem>
          ))}
        </RevealStagger>
      </Container>
    </section>
  );
}
