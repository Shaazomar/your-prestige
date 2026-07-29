import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, Download, ExternalLink, Layers } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/site/PageHero";
import { Reveal, RevealStagger, RevealItem } from "@/components/motion/Reveal";
import { ButtonLink } from "@/components/ui/Button";
import { CatalogBrowser } from "@/components/site/catalog/CatalogBrowser";
import { getBrands, getBrandBySlug, getBrandCollections } from "@/lib/brands";
import { parseFilters, searchCatalog } from "@/lib/catalog-search";
import { siteUrl } from "@/lib/site-config";

/**
 * A brand's catalogue library — every published product from that maker, with
 * its collections surfaced as entry points and the same faceted browser used
 * on the main catalogue.
 */

export const revalidate = 600;

export async function generateStaticParams() {
  try {
    const brands = await getBrands();
    return brands.filter((b) => b.productCount > 0).slice(0, 60).map((b) => ({ slug: b.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const brand = await getBrandBySlug(slug);
  if (!brand) return {};
  return {
    title: `${brand.name} — Authorised Dealer in Mangaluru`,
    description:
      brand.description ??
      `Browse the full ${brand.name} range at Prestige Tiles & Sanitary, Mangaluru — ${brand.productCount} products across tiles and sanitaryware, displayed at full scale in our showrooms.`,
    alternates: { canonical: `${siteUrl}/brands/${brand.slug}` },
    openGraph: { images: brand.banner ? [brand.banner] : undefined },
  };
}

export default async function BrandPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const brand = await getBrandBySlug(slug);
  if (!brand) notFound();

  const sp = await searchParams;
  const [collections, result] = await Promise.all([
    getBrandCollections(slug),
    searchCatalog({ ...parseFilters(sp), brand: brand.name }),
  ]);

  return (
    <>
      <PageHero
        eyebrow="Authorised Partner"
        title={brand.name}
        description={
          brand.description ??
          `The complete ${brand.name} range, displayed at full scale across our Mangaluru showrooms.`
        }
      />

      <section className="py-12">
        <Container>
          <div className="flex flex-wrap items-center gap-6 rounded-3xl border border-ink/8 bg-white/60 p-8">
            {brand.logo && (
              <div className="relative h-16 w-32 shrink-0">
                <Image src={brand.logo} alt={`${brand.name} logo`} fill className="object-contain" sizes="128px" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm text-ink/50">
                {brand.productCount} product{brand.productCount === 1 ? "" : "s"} in the catalogue
                {collections.length > 0 && ` across ${collections.length} collection${collections.length === 1 ? "" : "s"}`}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {brand.catalogPdf && (
                <a
                  href={brand.catalogPdf}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-ink/10 px-5 py-2.5 text-sm transition-colors hover:border-gold/50"
                >
                  <Download className="h-4 w-4" /> Catalogue PDF
                </a>
              )}
              {brand.website && (
                <a
                  href={brand.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-ink/10 px-5 py-2.5 text-sm transition-colors hover:border-gold/50"
                >
                  <ExternalLink className="h-4 w-4" /> Brand site
                </a>
              )}
              <ButtonLink href="/book-visit">Book a Viewing</ButtonLink>
            </div>
          </div>
        </Container>
      </section>

      {collections.length > 1 && (
        <section className="pb-8">
          <Container>
            <Reveal>
              <p className="text-eyebrow mb-4 flex items-center gap-2 text-ink/40">
                <Layers className="h-3.5 w-3.5" /> Collections
              </p>
            </Reveal>
            <RevealStagger className="flex flex-wrap gap-3">
              {collections.map((c) => (
                <RevealItem key={c.name}>
                  <Link
                    href={`/brands/${brand.slug}?collection=${encodeURIComponent(c.name)}`}
                    className="group inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white px-5 py-2.5 text-sm transition-colors hover:border-gold/50"
                  >
                    {c.name}
                    <span className="text-ink/35">{c.count}</span>
                    <ArrowUpRight className="h-3.5 w-3.5 text-gold opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                </RevealItem>
              ))}
            </RevealStagger>
          </Container>
        </section>
      )}

      <CatalogBrowser result={result} />
    </>
  );
}
