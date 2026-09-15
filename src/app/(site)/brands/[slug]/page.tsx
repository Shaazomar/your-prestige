import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, Download, ExternalLink } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { RevealStagger, RevealItem } from "@/components/motion/Reveal";
import { SafeImage } from "@/components/ui/SafeImage";
import { ProductCard } from "@/components/site/catalog/ProductCard";
import { Breadcrumbs } from "@/components/site/catalog/Breadcrumbs";
import {
  getBrandBySlug,
  getBrandCategoryTree,
  getBrandCollections,
  getBrandDirectory,
  type CategoryNode,
} from "@/lib/catalog-taxonomy";
import { searchCatalog } from "@/lib/catalog-search";
import { absoluteUrl } from "@/lib/seo";

export const revalidate = 600;

/** Pre-render the brand pages; anything new renders on demand. */
export async function generateStaticParams() {
  const brands = await getBrandDirectory();
  return brands.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const brand = await getBrandBySlug(slug);
  if (!brand) return { title: "Brand not found" };

  return {
    title: brand.name,
    description:
      brand.description ??
      `Explore the full ${brand.name} range at Prestige — ${brand.productCount.toLocaleString("en-IN")} products across every category we stock.`,
    alternates: { canonical: absoluteUrl(`/brands/${brand.slug}`) },
  };
}

export default async function BrandPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const brand = await getBrandBySlug(slug);
  if (!brand) notFound();

  // One query each, in parallel — the category tree and collection list are
  // grouped counts, not a query per row.
  const [categories, collections, featured] = await Promise.all([
    getBrandCategoryTree(brand.id),
    getBrandCollections(brand.id, 6),
    searchCatalog({ brandSlug: brand.slug, page: 1, perPage: 8, sort: "featured" }),
  ]);

  return (
    <main className="bg-ivory">
      {/* — Brand banner — */}
      <section className="relative overflow-hidden border-b hairline bg-gradient-to-br from-[#f4f2ec] to-[#e7e3d9]">
        {brand.banner && (
          <div className="absolute inset-0 opacity-25">
            <SafeImage src={brand.banner} alt="" fill className="object-cover" />
          </div>
        )}
        <Container size="wide" className="relative py-16 md:py-24">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Brands", href: "/brands" },
              { label: brand.name },
            ]}
            className="mb-8"
          />

          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              {brand.logo && (
                <div className="mb-6">
                  <SafeImage
                    src={brand.logo}
                    alt={brand.name}
                    width={220}
                    height={80}
                    placeholderLabel={brand.name}
                    className="max-h-14 w-auto object-contain"
                  />
                </div>
              )}
              <h1 className="text-display-md tracking-tight text-ink">{brand.name}</h1>
              {brand.description && (
                <p className="mt-4 max-w-xl text-[0.95rem] leading-relaxed text-ink/55">
                  {brand.description}
                </p>
              )}
              <p className="mt-5 text-[0.82rem] uppercase tracking-[0.18em] text-ink/40">
                {brand.productCount.toLocaleString("en-IN")} products
                {categories.length > 0 && ` · ${categories.length} categories`}
              </p>
            </div>

            {(brand.catalogPdf || brand.website) && (
              <div className="flex shrink-0 flex-wrap gap-3">
                {brand.catalogPdf && (
                  <a
                    href={brand.catalogPdf}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border hairline bg-canvas px-5 py-2.5 text-[0.82rem] font-medium text-ink/75 transition-colors hover:border-gold hover:text-gold"
                  >
                    <Download className="h-3.5 w-3.5" /> Catalogue
                  </a>
                )}
                {brand.website && (
                  <a
                    href={brand.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border hairline bg-canvas px-5 py-2.5 text-[0.82rem] font-medium text-ink/75 transition-colors hover:border-gold hover:text-gold"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> Official site
                  </a>
                )}
              </div>
            )}
          </div>
        </Container>
      </section>

      {/* — Categories, derived from this brand's own products — */}
      {categories.length > 0 && (
        <section className="py-16 md:py-24">
          <Container size="wide">
            <SectionHeading
              eyebrow="Explore the range"
              title={`${brand.name} categories`}
              className="mb-12"
            />
            <RevealStagger className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4" stagger={0.04}>
              {categories.flatMap((parent) =>
                // A top-level section with children shows the children, which
                // is the level a customer actually shops at. A section with
                // none shows itself.
                (parent.children.length > 0 ? parent.children : [parent]).map((node) => (
                  <RevealItem key={node.id}>
                    <CategoryCard brandSlug={brand.slug} node={node} />
                  </RevealItem>
                ))
              )}
            </RevealStagger>
          </Container>
        </section>
      )}

      {/* — Collections — */}
      {collections.length > 0 && (
        <section className="border-t hairline bg-canvas py-16 md:py-24">
          <Container size="wide">
            <SectionHeading eyebrow="Signature ranges" title="Featured collections" className="mb-12" />
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
              {collections.map((c) => (
                <Link
                  key={c.id}
                  href={`/brands/${brand.slug}?collection=${encodeURIComponent(c.name)}`}
                  className="group rounded-xl border hairline bg-ivory p-4 transition-colors hover:border-gold/40"
                >
                  <p className="truncate text-[0.88rem] font-medium text-ink group-hover:text-gold">
                    {c.name}
                  </p>
                  <p className="mt-1 text-[0.75rem] tabular-nums text-ink/40">
                    {c.productCount.toLocaleString("en-IN")} products
                  </p>
                </Link>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* — A taste of the catalogue, with the route to all of it — */}
      {featured.products.length > 0 && (
        <section className="border-t hairline py-16 md:py-24">
          <Container size="wide">
            <div className="mb-12 flex items-end justify-between gap-6">
              <SectionHeading eyebrow="From the range" title={`${brand.name} products`} />
              <Link
                href={`/brands/${brand.slug}/all`}
                className="inline-flex shrink-0 items-center gap-1.5 text-[0.85rem] font-medium text-ink/70 transition-colors hover:text-gold"
              >
                View all {brand.productCount.toLocaleString("en-IN")}
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 xl:grid-cols-4">
              {featured.products.map((p, i) => (
                <ProductCard key={p.slug} product={p} priority={i < 4} />
              ))}
            </div>
          </Container>
        </section>
      )}
    </main>
  );
}

function CategoryCard({ brandSlug, node }: { brandSlug: string; node: CategoryNode }) {
  return (
    <Link
      href={`/brands/${brandSlug}/${node.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl border hairline bg-canvas transition-all duration-500 hover:-translate-y-0.5 hover:border-gold/40"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
        <SafeImage
          src={node.image ?? ""}
          alt={node.name}
          fill
          placeholderLabel={node.name}
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover transition-transform duration-[900ms] group-hover:scale-[1.04]"
        />
      </div>
      <div className="p-4">
        <p className="text-[0.9rem] font-medium leading-snug text-ink group-hover:text-gold">
          {node.name}
        </p>
        <p className="mt-1 text-[0.75rem] tabular-nums text-ink/40">
          {node.productCount.toLocaleString("en-IN")} products
        </p>
      </div>
    </Link>
  );
}
