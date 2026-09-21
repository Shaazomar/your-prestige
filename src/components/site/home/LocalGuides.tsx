import Link from "next/link";
import { ArrowUpRight, MapPin } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal, RevealStagger, RevealItem } from "@/components/motion/Reveal";
import { getLandingPages } from "@/lib/landing-pages";

/**
 * Homepage → local-guide internal linking.
 *
 * `src/app/(site)/[landing]/page.tsx` serves genuine, individually written
 * pages for real local search demand — "Tiles in Mangaluru", "Bathroom Tiles
 * in Mangaluru", "Jaquar Dealer in Mangaluru" — but nothing on the site ever
 * linked to any of them. They existed, they were servable, and a crawler had
 * no way to find one without already knowing its exact URL. This section is
 * that link, from the page every crawler starts at.
 *
 * Renders nothing if the CMS has no published landing pages, so an empty
 * database never ships a section with nothing in it.
 */
export async function LocalGuides() {
  const pages = await getLandingPages();
  if (pages.length === 0) return null;

  return (
    <section className="border-t hairline bg-white py-20 md:py-28">
      <Container size="wide">
        <SectionHeading
          eyebrow="Local Guides"
          title="Wherever you're building in coastal Karnataka."
          description="Genuine, showroom-specific guidance for the searches people actually run — not the same page with the place name swapped."
          className="mb-12"
        />
        <RevealStagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" stagger={0.06}>
          {pages.map((p) => (
            <RevealItem key={p.slug}>
              <Link
                href={`/${p.slug}`}
                className="group flex h-full flex-col justify-between rounded-2xl border hairline bg-porcelain/60 p-6 transition-colors hover:border-gold/40 hover:bg-white"
              >
                <div>
                  <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-gold">
                    <MapPin className="h-3 w-3" />
                    {[p.locality, p.city].filter(Boolean).join(", ") || "Karnataka"}
                  </p>
                  <h3 className="mt-2 text-base font-medium leading-snug text-ink">
                    {p.heading}
                  </h3>
                </div>
                <span className="mt-5 inline-flex items-center gap-1.5 text-xs font-medium text-ink/50 transition-colors group-hover:text-gold">
                  Read more
                  <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </Link>
            </RevealItem>
          ))}
        </RevealStagger>
      </Container>
    </section>
  );
}
