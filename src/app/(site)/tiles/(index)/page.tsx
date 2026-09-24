import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { CatalogBrowser } from "@/components/site/catalog/CatalogBrowser";
import { parseFilters, searchCatalog } from "@/lib/catalog-search";
import { buildCategoryMetadata } from "@/lib/seo-metadata";

/**
 * Tiles at the top-level `/tiles` URL the primary nav points at (the
 * category-first sibling of `/bathware`). Motto, Velzone and Lonix don't yet
 * have GVT/PGVT/etc. sub-categories in the data (see the catalog-restructure
 * plan), so this stays a single flat category for now — Collection, Size,
 * Surface and Finish facets carry the browsing instead of inventing
 * subcategories the source data doesn't support.
 */

export const revalidate = 600;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const sp = await searchParams;
  // A hardcoded canonical here always pointed `/tiles?page=3` back at page
  // one — Google was told two pages showing different products were the same
  // page — and never dropped a filtered view (`?finish=matte&size=...`) out
  // of the index. `buildCategoryMetadata` applies the same
  // filter-noindex/pagination-self-canonical rule already used correctly on
  // every category and brand page; this page and `/bathware` were the two
  // that had been missed.
  return buildCategoryMetadata({
    name: "Premium Tiles",
    path: "/tiles",
    description:
      "Italian marble slabs, large-format porcelain and artisan ceramics — engineered surfaces with the soul of natural stone.",
    searchParams: sp,
  });
}

export default async function TilesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const result = await searchCatalog({ ...parseFilters(sp), category: "tiles" });

  return (
    <main className="min-h-screen bg-white">
      <section className="pb-4 pt-8">
        <Container size="wide">
          <Breadcrumbs items={[{ label: "Tiles" }]} />
        </Container>
      </section>

      <CatalogBrowser
        result={result}
        lockedCategory="tiles"
        eyebrow="Tiles Collection"
        title="Premium Tiles"
        description="Italian marble slabs, large-format porcelain and artisan ceramics — engineered surfaces with the soul of natural stone."
      />
    </main>
  );
}
