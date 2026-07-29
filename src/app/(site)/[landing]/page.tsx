import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowUpRight, MapPin, Phone } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/site/PageHero";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { Reveal, RevealStagger, RevealItem } from "@/components/motion/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ButtonLink } from "@/components/ui/Button";
import { FaqAccordion } from "@/components/site/FaqAccordion";
import { getLandingPage, getLandingSlugs } from "@/lib/landing-pages";
import { getShowrooms, formatAddress, directionsHref } from "@/lib/showrooms";
import { getCatalogProducts } from "@/lib/products";
import { getBusiness, telHref } from "@/lib/business";
import { applySeo, getSeoForPath } from "@/lib/seo";
import { siteUrl } from "@/lib/site-config";

/**
 * Local-SEO landing pages at root URLs — /tiles-mangaluru, /jaquar-dealer-mangaluru.
 *
 * A root dynamic segment can't shadow the real routes: Next resolves static
 * segments (/about, /products, /showrooms) before dynamic ones. What it does
 * do is catch every unmatched path, so `generateStaticParams` returns an
 * explicit allowlist and anything else calls notFound() — landing on the same
 * not-found page as before.
 */

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  const slugs = await getLandingSlugs();
  return slugs.map((landing) => ({ landing }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ landing: string }>;
}): Promise<Metadata> {
  const { landing } = await params;
  const page = await getLandingPage(landing);
  if (!page) return {};

  const path = `/${page.slug}`;
  const base: Metadata = {
    title: page.title,
    description: page.intro ?? page.subheading ?? undefined,
    alternates: { canonical: `${siteUrl}${path}` },
  };
  return applySeo(base, await getSeoForPath(path), path);
}

export default async function LandingPage({
  params,
}: {
  params: Promise<{ landing: string }>;
}) {
  const { landing } = await params;
  const page = await getLandingPage(landing);
  if (!page) notFound();

  const [allShowrooms, business, products] = await Promise.all([
    getShowrooms(),
    getBusiness(),
    getCatalogProducts({ limit: 6 }),
  ]);

  const showrooms = page.showroomIds.length
    ? allShowrooms.filter((s) => page.showroomIds.includes(s.id))
    : allShowrooms;

  /**
   * A `Service` describing what this page offers and where, provided by the
   * showrooms that serve it.
   *
   * Deliberately *not* another set of LocalBusiness entities: the site layout
   * already emits one HomeGoodsStore per showroom on every page, so repeating
   * them here would put eight competing store records on a single URL —
   * duplicate local markup confuses which entity a page is about and is worth
   * less than one clean record. The showrooms are referenced by their existing
   * @id instead, which links this page to them without redeclaring them.
   */
  const jsonLd: Record<string, unknown>[] = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: `${page.serviceType ?? "Tiles & Sanitaryware"} in ${page.locality ?? page.city ?? "Karnataka"}`,
      description: page.intro ?? page.subheading ?? undefined,
      url: `${siteUrl}/${page.slug}`,
      serviceType: page.serviceType ?? "Tiles & Sanitaryware",
      // @id must match the one JsonLd.tsx emits for each showroom, or the
      // reference resolves to nothing and the link is decorative.
      provider: showrooms.map((s) => ({
        "@type": "HomeGoodsStore",
        "@id": `${siteUrl}/showrooms/${s.slug}/#localbusiness`,
        name: s.name,
        telephone: s.phone,
      })),
      ...(page.areaServed.length
        ? { areaServed: page.areaServed.map((a) => ({ "@type": "Place", name: a })) }
        : {}),
    },
  ];

  if (page.faqs.length) {
    jsonLd.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: page.faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    });
  }

  return (
    <>
      {jsonLd.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      <PageHero
        eyebrow={[page.locality, page.city].filter(Boolean).join(", ") || "Karnataka"}
        title={page.heading}
        description={page.subheading ?? undefined}
      />

      <section className="py-16 md:py-24">
        <Container>
          <Breadcrumbs items={[{ label: page.title.split("—")[0].trim() }]} />

          {page.intro && (
            <Reveal>
              <p className="mt-8 max-w-3xl text-lg leading-relaxed text-ink/70">{page.intro}</p>
            </Reveal>
          )}

          {page.blocks.length > 0 && (
            <RevealStagger className="mt-16 grid gap-10 md:grid-cols-3" stagger={0.1}>
              {page.blocks.map((b, i) => (
                <RevealItem key={i}>
                  <div className="h-full rounded-3xl border hairline bg-white/60 p-8">
                    {b.heading && (
                      <h2 className="text-xl font-semibold tracking-tight">{b.heading}</h2>
                    )}
                    {b.body && (
                      <p className="mt-4 leading-relaxed text-ink/60">{b.body}</p>
                    )}
                  </div>
                </RevealItem>
              ))}
            </RevealStagger>
          )}
        </Container>
      </section>

      {/* Showrooms serving this area */}
      {showrooms.length > 0 && (
        <section className="border-t hairline bg-porcelain py-20 md:py-28">
          <Container>
            <SectionHeading
              eyebrow="Visit Us"
              title={`Showrooms serving ${page.locality ?? page.city ?? "the region"}`}
              className="mb-12"
            />
            <RevealStagger className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" stagger={0.08}>
              {showrooms.map((s) => (
                <RevealItem key={s.id}>
                  <div className="flex h-full flex-col rounded-3xl border hairline bg-white p-7">
                    <h3 className="font-semibold tracking-tight">{s.name}</h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-ink/50">
                      {formatAddress(s)}
                    </p>
                    <p className="mt-4 text-xs text-ink/40">{s.hoursWeekdays}</p>
                    <p className="text-xs text-ink/40">{s.hoursSunday}</p>
                    <div className="mt-5 flex flex-wrap gap-3">
                      <a
                        href={telHref(s.phone)}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-gold hover:underline"
                      >
                        <Phone className="h-3 w-3" /> {s.phone}
                      </a>
                      <a
                        href={directionsHref(s)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-ink/50 hover:text-gold"
                      >
                        <MapPin className="h-3 w-3" /> Directions
                      </a>
                    </div>
                  </div>
                </RevealItem>
              ))}
            </RevealStagger>
          </Container>
        </section>
      )}

      {/* A genuine route into the catalogue, not a dead end */}
      {products.length > 0 && (
        <section className="py-20 md:py-28">
          <Container>
            <SectionHeading
              eyebrow="From the Catalogue"
              title="A few pieces worth seeing"
              className="mb-12"
            />
            <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-6">
              {products.map((p) => (
                <Link key={p.slug} href={`/products/${p.category}/${p.slug}`} className="group block">
                  <div className="relative aspect-square overflow-hidden rounded-2xl bg-ink/5">
                    <Image
                      src={p.lifestyleImage}
                      alt={p.name}
                      fill
                      sizes="(max-width: 768px) 45vw, 16vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <p className="mt-2 truncate text-sm font-medium">{p.name}</p>
                  <p className="truncate text-xs text-ink/40">{p.brand}</p>
                </Link>
              ))}
            </div>
            <div className="mt-10">
              <ButtonLink href="/products" variant="outline">
                Browse the full catalogue
                <ArrowUpRight className="h-4 w-4" />
              </ButtonLink>
            </div>
          </Container>
        </section>
      )}

      {page.faqs.length > 0 && (
        <section className="border-t hairline bg-porcelain py-20 md:py-28">
          <Container size="narrow">
            <SectionHeading eyebrow="Questions" title="Worth knowing" className="mb-12" />
            <FaqAccordion items={page.faqs} />
          </Container>
        </section>
      )}

      <section className="bg-ink py-20 text-ivory md:py-28">
        <Container className="text-center">
          <h2 className="text-display-sm">Come and see it at full scale.</h2>
          <p className="mx-auto mt-5 max-w-xl text-ivory/60">
            Book a visit and we&apos;ll have the ranges you&apos;re considering laid out when you arrive.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-4">
            <ButtonLink href="/book-visit" variant="gold" size="lg">
              Book a Visit
            </ButtonLink>
            <a
              href={telHref(business.phone)}
              className="inline-flex items-center gap-2 rounded-full border border-ivory/25 px-7 py-4 text-sm font-medium transition-colors hover:border-gold hover:text-gold"
            >
              <Phone className="h-4 w-4" /> {business.phone}
            </a>
          </div>
        </Container>
      </section>
    </>
  );
}
