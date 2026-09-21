import type { Metadata } from "next";
import { CatalogExplorer } from "@/components/site/catalog/CatalogExplorer";
import { CatalogBrowser } from "@/components/site/catalog/CatalogBrowser";
import { BrandStrip } from "@/components/site/catalog/BrandStrip";
import { getCatalogProducts, CATALOG_CLIENT_LIMIT } from "@/lib/products";
import { countPublishedProducts, parseFilters, searchCatalog } from "@/lib/catalog-search";
import { getBrands } from "@/lib/brands";
import { buildCategoryMetadata } from "@/lib/seo-metadata";

// Published product changes should surface without a redeploy.
export const revalidate = 300;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const sp = await searchParams;
  // This page had a static `metadata` object: no canonical at all, and
  // nothing to stop `?brand=jaquar&finish=matte&size=...` — a combinatorial
  // space in the thousands across 5,500+ products — from being crawled and
  // indexed as distinct pages. Every category and brand page in the
  // catalogue already self-canonicalises a filtered view back to its clean
  // URL and marks it `noindex, follow`; this page, the one with the largest
  // filter surface of any of them, had been missed.
  const count = await countPublishedProducts();
  return buildCategoryMetadata({
    name: "The Catalogue",
    path: "/products",
    count,
    description:
      "Explore Prestige's full catalogue — premium tiles, luxury sanitaryware and designer picks from 40+ world-class brands, filterable by room, brand and finish.",
    searchParams: sp,
  });
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const count = await countPublishedProducts();
  const hasFilters = Object.keys(sp).some((k) => k !== "page");

  const useServerBrowser = count > CATALOG_CLIENT_LIMIT || hasFilters;

  return (
    <main className="min-h-screen bg-white">
      {useServerBrowser ? (
        <CatalogBrowser
          result={await searchCatalog(parseFilters(sp))}
          eyebrow="PRODUCTS"
          title={"Explore our\ncomplete collection."}
          description="Search by brand, product code or collection — then filter by room, finish or size to find exactly what you need."
          brandStrip={
            <BrandStrip
              brands={(await getBrands())
                .filter((b) => b.productCount > 0)
                .map((b) => ({ slug: b.slug, name: b.name, count: b.productCount }))}
            />
          }
          searchPlaceholder="Search products, brands, product codes, collections…"
          showCategoryOnCards
        />
      ) : (
        <CatalogExplorer
          products={await getCatalogProducts()}
          eyebrow="PRODUCTS"
          title={"Explore our\ncomplete collection."}
          description="Search by brand, product code or collection — then filter by room, finish or size to find exactly what you need."
        />
      )}
    </main>
  );
}
