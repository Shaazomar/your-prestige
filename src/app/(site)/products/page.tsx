import type { Metadata } from "next";
import { CatalogExplorer } from "@/components/site/catalog/CatalogExplorer";
import { CatalogBrowser } from "@/components/site/catalog/CatalogBrowser";
import { BrandStrip } from "@/components/site/catalog/BrandStrip";
import { getCatalogProducts, CATALOG_CLIENT_LIMIT } from "@/lib/products";
import { countPublishedProducts, parseFilters, searchCatalog } from "@/lib/catalog-search";
import { getBrands } from "@/lib/brands";

export const metadata: Metadata = {
  title: "The Catalogue",
  description:
    "Explore Your Prestige's full catalogue — premium tiles, luxury sanitaryware and designer picks from 40+ world-class brands, filterable by room, brand and finish.",
};

// Published product changes should surface without a redeploy.
export const revalidate = 300;

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
