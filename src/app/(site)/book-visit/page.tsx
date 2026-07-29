import type { Metadata } from "next";
import { CalendarCheck2, Coffee, Compass, Users } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Container } from "@/components/ui/Container";
import { LeadForm } from "@/components/site/LeadForm";
import { getCatalogProduct } from "@/lib/products";
import { Reveal, RevealStagger, RevealItem } from "@/components/motion/Reveal";
import { getShowrooms } from "@/lib/showrooms";

export const metadata: Metadata = {
  title: "Book a Visit",
  description:
    "Book a private consultation at any Prestige showroom across Mangaluru, Puttur and Moodbidri — a guided walkthrough with a dedicated design consultant.",
};

const expectations = [
  {
    icon: Users,
    title: "A dedicated consultant",
    body: "One expert, focused entirely on your project — not a floor salesperson.",
  },
  {
    icon: Compass,
    title: "A guided walkthrough",
    body: "Full slabs, live bathroom suites and material libraries, curated to your brief.",
  },
  {
    icon: Coffee,
    title: "Zero pressure",
    body: "This is a design session, not a sales pitch. Great coffee included.",
  },
] as const;

export default async function BookVisitPage({
  searchParams,
}: {
  searchParams: Promise<{ showroom?: string; product?: string }>;
}) {
  const [{ showroom, product: productSlug }, showrooms] = await Promise.all([
    searchParams,
    getShowrooms(),
  ]);
  const product = productSlug ? await getCatalogProduct(productSlug) : null;
  const preselected = showrooms.find((s) => s.slug === showroom);

  return (
    <>
      <PageHero
        eyebrow="Private Consultation"
        title="Reserve your walkthrough."
        description="Sixty minutes that will change how you think about your project. Complimentary, always."
      />

      <section className="bg-ivory py-20 md:py-28">
        <Container size="wide">
          <div className="grid gap-14 lg:grid-cols-5 lg:gap-20">
            <div className="lg:col-span-2">
              <RevealStagger className="space-y-6" stagger={0.12}>
                {expectations.map((e) => (
                  <RevealItem key={e.title}>
                    <div className="flex gap-5 rounded-3xl border hairline bg-white p-7 shadow-soft">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gold/10">
                        <e.icon className="h-5 w-5 text-gold" />
                      </span>
                      <div>
                        <h3 className="font-semibold text-ink">{e.title}</h3>
                        <p className="mt-1.5 text-sm leading-relaxed text-slate-warm">
                          {e.body}
                        </p>
                      </div>
                    </div>
                  </RevealItem>
                ))}
              </RevealStagger>
            </div>

            <Reveal delay={0.2} className="lg:col-span-3">
              <div className="rounded-3xl border hairline bg-white p-8 shadow-soft md:p-12">
                <span className="mb-6 inline-flex items-center gap-2 rounded-full bg-gold/10 px-4 py-1.5 text-xs font-semibold text-gold-deep">
                  <CalendarCheck2 className="h-3.5 w-3.5" />
                  Usually confirmed within 2 hours
                </span>
                <h2 className="text-2xl font-semibold tracking-tight text-ink">
                  Book your visit
                </h2>
                <p className="mb-8 mt-2 text-slate-warm">
                  {preselected
                    ? `Booking a visit to our ${preselected.locality ?? preselected.city} showroom — pick a date and we'll confirm by phone or WhatsApp.`
                    : "Choose a showroom and date — we'll confirm your slot by phone or WhatsApp."}
                </p>
                <LeadForm
                  type="VISIT"
                  submitLabel="Reserve My Slot"
                  showVisitDate
                  showrooms={showrooms.map((s) => ({
                    slug: s.slug,
                    name: s.name,
                    locality: s.locality,
                    city: s.city,
                  }))}
                  defaultShowroom={preselected?.slug}
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
