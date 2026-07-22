import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowUpRight, Download, Ruler, Layers, Building2 } from "lucide-react";
import { products } from "@/lib/demo-content";
import { Container } from "@/components/ui/Container";
import { Reveal, RevealStagger, RevealItem } from "@/components/motion/Reveal";
import { TextReveal } from "@/components/motion/TextReveal";
import { ButtonLink } from "@/components/ui/Button";
import { ProductCard } from "@/components/site/ProductCard";

export function generateStaticParams() {
  return products.map((p) => ({ category: p.category, slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = products.find((p) => p.slug === slug);
  if (!product) return {};
  return {
    title: `${product.name} — ${product.brand}`,
    description: `${product.name} by ${product.brand}. ${product.finish}, ${product.size}. Experience it at Your Prestige, Mangaluru.`,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = products.find((p) => p.slug === slug);
  if (!product) notFound();

  const related = products.filter(
    (p) => p.category === product.category && p.slug !== product.slug
  );

  const specs = [
    { icon: Ruler, label: "Size", value: product.size },
    { icon: Layers, label: "Finish", value: product.finish },
    { icon: Building2, label: "Brand", value: product.brand },
  ];

  return (
    <>
      {/* Product hero */}
      <section className="bg-ink pt-32 text-ivory md:pt-40">
        <Container size="wide">
          <div className="grid items-center gap-12 pb-20 lg:grid-cols-2 lg:gap-20 lg:pb-28">
            <div>
              <Reveal direction="none">
                <p className="text-eyebrow mb-6 text-gold">{product.tag}</p>
              </Reveal>
              <TextReveal as="h1" text={product.name} className="text-display-md" />
              <Reveal delay={0.25}>
                <p className="mt-6 max-w-md text-lg leading-relaxed text-ivory/60">
                  {product.finish} by {product.brand} — a statement surface for spaces
                  that refuse to be ordinary.
                </p>
              </Reveal>
              <RevealStagger className="mt-10 grid grid-cols-3 gap-6" stagger={0.1}>
                {specs.map((s) => (
                  <RevealItem key={s.label}>
                    <div className="rounded-2xl border hairline-light p-5">
                      <s.icon className="mb-3 h-5 w-5 text-gold" />
                      <p className="text-xs uppercase tracking-[0.2em] text-ivory/40">
                        {s.label}
                      </p>
                      <p className="mt-1.5 text-sm font-medium">{s.value}</p>
                    </div>
                  </RevealItem>
                ))}
              </RevealStagger>
              <Reveal delay={0.5}>
                <div className="mt-10 flex flex-wrap gap-4">
                  <ButtonLink href="/request-quote" variant="gold" size="lg">
                    Request a Quote
                    <ArrowUpRight className="h-5 w-5" />
                  </ButtonLink>
                  <ButtonLink href="/book-visit" variant="outline-light" size="lg">
                    See it in the Showroom
                  </ButtonLink>
                </div>
              </Reveal>
            </div>
            <Reveal direction="left" delay={0.2}>
              <div className="relative aspect-[4/5] overflow-hidden rounded-3xl">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* Applications + downloads */}
      <section className="bg-ivory py-20 md:py-28">
        <Container size="wide">
          <div className="flex flex-col justify-between gap-8 rounded-3xl bg-porcelain p-10 md:flex-row md:items-center md:p-14">
            <div>
              <p className="text-eyebrow mb-3 text-gold">Applications</p>
              <p className="max-w-lg text-lg text-slate-warm">
                Living spaces · Feature walls · Bathrooms · Commercial lobbies —
                our consultants will map this surface to your project.
              </p>
            </div>
            <button className="group inline-flex items-center gap-3 rounded-full border border-ink/15 px-7 py-4 text-sm font-medium transition-all duration-500 hover:border-ink hover:bg-ink hover:text-ivory">
              <Download className="h-4 w-4" />
              Download Specification Sheet
            </button>
          </div>
        </Container>
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section className="border-t hairline bg-ivory pb-28 pt-4 md:pb-36">
          <Container size="wide">
            <p className="text-eyebrow mb-10 pt-16 text-gold">You may also love</p>
            <RevealStagger className="grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3" stagger={0.1}>
              {related.map((p) => (
                <RevealItem key={p.slug}>
                  <ProductCard product={p} />
                </RevealItem>
              ))}
            </RevealStagger>
          </Container>
        </section>
      )}
    </>
  );
}
