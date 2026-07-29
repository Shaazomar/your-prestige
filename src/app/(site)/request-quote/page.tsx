import type { Metadata } from "next";
import { FileText, Timer, BadgeCheck } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Container } from "@/components/ui/Container";
import { LeadForm } from "@/components/site/LeadForm";
import { getCatalogProduct } from "@/lib/products";
import { Reveal, RevealStagger, RevealItem } from "@/components/motion/Reveal";

export const metadata: Metadata = {
  title: "Request a Quote",
  description:
    "Get a tailored quotation for tiles and sanitaryware from Your Prestige, Mangaluru — detailed, transparent and fast.",
};

const promises = [
  {
    icon: Timer,
    title: "Fast turnaround",
    body: "Detailed quotations within one working day for most projects.",
  },
  {
    icon: FileText,
    title: "Line-item transparency",
    body: "Every surface, fitting and quantity itemised — no lump-sum mysteries.",
  },
  {
    icon: BadgeCheck,
    title: "Price-match confidence",
    body: "Authorised-partner pricing on all 40+ brands, backed in writing.",
  },
] as const;

export default async function RequestQuotePage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string }>;
}) {
  const { product: productSlug } = await searchParams;
  // Resolve the slug to a real name so the seeded message reads naturally —
  // and so an invalid slug simply prefills nothing.
  const product = productSlug ? await getCatalogProduct(productSlug) : null;

  return (
    <>
      <PageHero
        eyebrow="Quotation"
        title="A precise price for a precise vision."
        description="Share your project details and receive a tailored, transparent quotation — usually within one working day."
      />

      <section className="bg-ivory py-20 md:py-28">
        <Container size="wide">
          <div className="grid gap-14 lg:grid-cols-5 lg:gap-20">
            <div className="lg:col-span-2">
              <RevealStagger className="space-y-6" stagger={0.12}>
                {promises.map((p) => (
                  <RevealItem key={p.title}>
                    <div className="flex gap-5 rounded-3xl border hairline bg-white p-7 shadow-soft">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gold/10">
                        <p.icon className="h-5 w-5 text-gold" />
                      </span>
                      <div>
                        <h3 className="font-semibold text-ink">{p.title}</h3>
                        <p className="mt-1.5 text-sm leading-relaxed text-slate-warm">
                          {p.body}
                        </p>
                      </div>
                    </div>
                  </RevealItem>
                ))}
              </RevealStagger>
            </div>

            <Reveal delay={0.2} className="lg:col-span-3">
              <div className="rounded-3xl border hairline bg-white p-8 shadow-soft md:p-12">
                <h2 className="text-2xl font-semibold tracking-tight text-ink">
                  Request your quote
                </h2>
                <p className="mb-8 mt-2 text-slate-warm">
                  The more detail you share, the sharper the quote.
                </p>
                <LeadForm
                  type="QUOTE"
                  submitLabel="Request Quote"
                  showBudget
                  defaultProduct={product ? `${product.name} (${product.brand})` : undefined}
                />
              </div>
            </Reveal>
          </div>
        </Container>
      </section>
    </>
  );
}
