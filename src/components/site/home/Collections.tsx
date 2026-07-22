import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { collections } from "@/lib/demo-content";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { RevealStagger, RevealItem } from "@/components/motion/Reveal";

export function Collections() {
  return (
    <section className="bg-ivory py-28 md:py-40">
      <Container size="wide">
        <div className="mb-16 flex flex-col justify-between gap-8 md:mb-20 md:flex-row md:items-end">
          <SectionHeading
            eyebrow="Featured Collections"
            title="Curated for the discerning eye"
            description="Four worlds of surfaces and sanctuaries — each collection assembled from the finest Indian and international houses."
          />
        </div>

        <RevealStagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4" stagger={0.12}>
          {collections.map((c, i) => (
            <RevealItem key={c.title} className={i % 2 === 1 ? "lg:mt-16" : ""}>
              <Link
                href={`/products/${c.slug}`}
                className="group block overflow-hidden rounded-3xl bg-charcoal"
              >
                <div className="relative aspect-[3/4] overflow-hidden">
                  <Image
                    src={c.image}
                    alt={c.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover transition-transform duration-[1.4s] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/20 to-transparent transition-opacity duration-700" />

                  {/* Count chip */}
                  <span className="glass-dark absolute right-4 top-4 rounded-full px-3.5 py-1.5 text-xs font-medium text-ivory/90">
                    {c.count}
                  </span>

                  {/* Copy */}
                  <div className="absolute inset-x-0 bottom-0 p-7">
                    <h3 className="text-2xl font-semibold tracking-tight text-ivory">
                      {c.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-ivory/60 opacity-0 transition-all duration-700 group-hover:opacity-100">
                      {c.subtitle}
                    </p>
                    <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-gold">
                      Explore
                      <ArrowUpRight className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-1 group-hover:-translate-y-1" />
                    </span>
                  </div>
                </div>
              </Link>
            </RevealItem>
          ))}
        </RevealStagger>
      </Container>
    </section>
  );
}
