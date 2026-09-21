import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/site/PageHero";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { RevealStagger, RevealItem } from "@/components/motion/Reveal";
import { CatalogBrowser } from "@/components/site/catalog/CatalogBrowser";
import { getBathwareCategories } from "@/lib/brands";
import { parseFilters, searchCatalog } from "@/lib/catalog-search";
import { buildCategoryMetadata } from "@/lib/seo-metadata";

/**
 * Category-first browsing across every brand — the sibling of `/brands`
 * (brand-first). `/bathware/[category]` narrows to one category; this page
 * spans the whole "bathware" subtree via `categoryGroup`.
 */

export const revalidate = 600;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const sp = await searchParams;
  // See the identical fix on `/tiles`: a hardcoded canonical here meant every
  // paginated and filtered view claimed to be the same page as `/bathware`
  // itself, and no filtered view ever dropped out of the index.
  return buildCategoryMetadata({
    name: "Luxury Sanitaryware & Bathware",
    path: "/bathware",
    description:
      "Faucets, showers, sanitaryware, wellness and more from every brand we carry — displayed at full scale across our Mangaluru showrooms.",
    searchParams: sp,
  });
}

export default async function BathwarePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const [categories, result] = await Promise.all([
    getBathwareCategories(),
    searchCatalog({ ...parseFilters(sp), categoryGroup: "bathware" }),
  ]);

  return (
    <main className="min-h-screen bg-white">
      <section className="pb-4 pt-8">
        <Container size="wide">
          <Breadcrumbs items={[{ label: "Bathware" }]} />
        </Container>
      </section>

      <PageHero
        eyebrow="Sanitary Collection"
        title="Luxury Sanitaryware"
        description="Faucets, wellness systems, freestanding tubs and sculptural basins from the world's finest houses."
      />

      {categories.length > 0 && (
        <section className="py-12">
          <Container size="wide">
            <RevealStagger className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
              {categories.map((c) => (
                <RevealItem key={c.slug}>
                  <Link
                    href={`/bathware/${c.slug}`}
                    className="group flex flex-col items-center justify-center gap-1 rounded-2xl border border-ink/8 bg-white px-4 py-6 text-center transition-colors hover:border-gold/50"
                  >
                    <span className="text-sm font-semibold text-slate-warm">{c.name}</span>
                    <span className="text-xs text-ink/40">{c.count} piece{c.count === 1 ? "" : "s"}</span>
                  </Link>
                </RevealItem>
              ))}
            </RevealStagger>
          </Container>
        </section>
      )}

      <CatalogBrowser result={result} showCategoryOnCards showHero={false} />
    </main>
  );
}
