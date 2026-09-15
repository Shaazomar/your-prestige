import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { CatalogBrowser } from "@/components/site/catalog/CatalogBrowser";
import { parseFilters, searchCatalog } from "@/lib/catalog-search";
import { siteUrl } from "@/lib/site-config";

/**
 * Tiles at the top-level `/tiles` URL the primary nav points at (the
 * category-first sibling of `/bathware`). Motto, Velzone and Lonix don't yet
 * have GVT/PGVT/etc. sub-categories in the data (see the catalog-restructure
 * plan), so this stays a single flat category for now — Collection, Size,
 * Surface and Finish facets carry the browsing instead of inventing
 * subcategories the source data doesn't support.
 */

export const revalidate = 600;

export const metadata: Metadata = {
  title: "Premium Tiles",
  description:
    "Italian marble slabs, large-format porcelain and artisan ceramics — engineered surfaces with the soul of natural stone.",
  alternates: { canonical: `${siteUrl}/tiles` },
};

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
