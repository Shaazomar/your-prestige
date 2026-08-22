import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogExplorer } from "@/components/site/catalog/CatalogExplorer";
import type { CatalogProduct } from "@/lib/catalog";
import { CatalogBrowser } from "@/components/site/catalog/CatalogBrowser";
import { getCatalogProducts, CATALOG_CLIENT_LIMIT } from "@/lib/products";
import { countPublishedProducts, parseFilters, searchCatalog } from "@/lib/catalog-search";

const categories = {
  tiles: {
    title: "Premium Tiles",
    eyebrow: "Tiles Collection",
    description:
      "Italian marble slabs, large-format porcelain and artisan ceramics — engineered surfaces with the soul of natural stone.",
  },
  sanitary: {
    title: "Luxury Sanitaryware",
    eyebrow: "Sanitary Collection",
    description:
      "Sanctuary bathrooms from the world's finest houses — faucets, wellness systems, freestanding tubs and sculptural basins.",
  },
  "designer-picks": {
    title: "Designer Picks",
    eyebrow: "Curated Monthly",
    description:
      "Hand-selected statements chosen by our design consultants — the pieces we'd put in our own homes.",
  },
} as const;

type CategoryKey = keyof typeof categories;

export const revalidate = 300;

export function generateStaticParams() {
  return Object.keys(categories).map((category) => ({ category }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const cat = categories[category as CategoryKey];
  if (!cat) return {};
  return { title: cat.title, description: cat.description };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { category } = await params;
  const cat = categories[category as CategoryKey];
  if (!cat) notFound();

  const sp = await searchParams;
  const count = await countPublishedProducts();
  const hasFilters = Object.keys(sp).some((k) => k !== "page");
  const useServerBrowser = count > CATALOG_CLIENT_LIMIT || hasFilters;

  if (useServerBrowser) {
    const result = await searchCatalog({ ...parseFilters(sp), category });
    return (
      <main className="min-h-screen bg-white">
        <CatalogBrowser
          result={result}
          lockedCategory={category}
          eyebrow={cat.eyebrow}
          title={cat.title}
          description={cat.description}
        />
      </main>
    );
  }

  const products = await getCatalogProducts();

  return (
    <main className="min-h-screen bg-white">
      <CatalogExplorer
        products={products}
        lockedCategory={category as CatalogProduct["category"]}
        eyebrow={cat.eyebrow}
        title={cat.title}
        description={cat.description}
      />
    </main>
  );
}
