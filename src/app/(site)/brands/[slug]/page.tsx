import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, Download, ExternalLink, Layers } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Reveal, RevealStagger, RevealItem } from "@/components/motion/Reveal";
import { ButtonLink } from "@/components/ui/Button";
import { CatalogBrowser } from "@/components/site/catalog/CatalogBrowser";
import { ProductCard } from "@/components/site/catalog/ProductCard";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { BrandHero } from "@/components/site/brands/BrandHero";
import { BrandCategoryCard } from "@/components/site/brands/BrandCategoryCard";
import { FeaturedCollectionCard } from "@/components/site/brands/FeaturedCollectionCard";
import {
  getBrands,
  getBrandBySlug,
  getBrandCollections,
  getBrandCategories,
  getBrandFeaturedProducts,
  getBrandFeaturedCollections,
} from "@/lib/brands";
import { parseFilters, searchCatalog } from "@/lib/catalog-search";
import { getSeoForPath } from "@/lib/seo";
import { siteUrl } from "@/lib/site-config";

/**
 * A brand's dedicated mini-website — hero, categories, featured products and
 * collections, then the full faceted catalogue for everything else.
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

  const seo = await getSeoForPath(`/brands/${slug}`);
  return {
    title: seo?.title ?? `${brand.name} Collections | Prestige`,
    description:
      seo?.description ??
      brand.shortDescription ??
      brand.description ??
      `Browse the full ${brand.name} range at Prestige Tiles & Sanitary, Mangaluru — ${brand.productCount} products across ${brand.categoryCount} categories, displayed at full scale in our showrooms.`,
    alternates: { canonical: `${siteUrl}/brands/${brand.slug}` },
    openGraph: { images: seo?.ogImage ? [seo.ogImage] : brand.banner ? [brand.banner] : undefined },
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
  const [categories, collections, featuredProducts, featuredCollections, result] = await Promise.all([
    getBrandCategories(slug),
    getBrandCollections(slug),
    getBrandFeaturedProducts({ id: brand.id, featuredProductIds: brand.featuredProductIds }),
    getBrandFeaturedCollections(slug),
    searchCatalog({ ...parseFilters(sp), brand: brand.name }),
  ]);

  return (
    <>
      <section className="pb-2 pt-8">
        <Container size="wide">
          <Breadcrumbs items={[{ label: "Brands", href: "/brands" }, { label: brand.name }]} />
        </Container>
      </section>

      <BrandHero brand={brand} />

      {brand.productCount === 0 ? (
        <section className="py-24 text-center">
          <Container>
            <p className="text-lg text-ink/50">No products available in this collection yet.</p>
            <p className="mt-2 text-sm text-ink/35">Check back soon, or explore another brand.</p>
            <div className="mt-8">
              <ButtonLink href="/brands">Browse All Brands</ButtonLink>
            </div>
          </Container>
        </section>
      ) : (
        <>
          <section className="py-12">
            <Container>
              <div className="flex flex-wrap items-center gap-6 rounded-3xl border border-ink/8 bg-white/60 p-8">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-ink/50">
                    {brand.productCount} product{brand.productCount === 1 ? "" : "s"} across{" "}
                    {brand.categoryCount} categor{brand.categoryCount === 1 ? "y" : "ies"}
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

          {categories.length > 0 && (
            <section className="pb-16">
              <Container>
                <Reveal>
                  <p className="text-eyebrow mb-5 flex items-center gap-2 text-ink/40">
                    <Layers className="h-3.5 w-3.5" /> Shop by Category
                  </p>
                </Reveal>
                <RevealStagger className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                  {categories.map((c) => (
                    <RevealItem key={c.slug}>
                      <BrandCategoryCard brandSlug={brand.slug} category={c} />
                    </RevealItem>
                  ))}
                </RevealStagger>
              </Container>
            </section>
          )}

          {featuredCollections.length > 0 && (
            <section className="pb-16">
              <Container>
                <Reveal>
                  <p className="text-eyebrow mb-5 text-ink/40">Featured Collections</p>
                </Reveal>
                <RevealStagger className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                  {featuredCollections.map((c) => (
                    <RevealItem key={c.slug}>
                      <FeaturedCollectionCard brandSlug={brand.slug} collection={c} />
                    </RevealItem>
                  ))}
                </RevealStagger>
              </Container>
            </section>
          )}

          {featuredProducts.length > 0 && (
            <section className="pb-16">
              <Container>
                <div className="mb-5 flex items-end justify-between">
                  <Reveal>
                    <p className="text-eyebrow text-ink/40">Featured from {brand.name}</p>
                  </Reveal>
                  <Link
                    href="#products"
                    className="hidden items-center gap-1.5 text-sm text-gold hover:underline sm:inline-flex"
                  >
                    View All {brand.name} Products <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                  {featuredProducts.map((p) => (
                    <ProductCard key={p.slug} product={p} />
                  ))}
                </div>
              </Container>
            </section>
          )}

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

          <div id="products" className="scroll-mt-24">
            <CatalogBrowser result={result} lockedBrand={brand.name} />
          </div>
        </>
      )}
    </>
  );
}
