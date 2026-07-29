import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/site/PageHero";
import { CatalogExplorer } from "@/components/site/catalog/CatalogExplorer";
import type { CatalogProduct } from "@/lib/catalog";
import { getCatalogProducts } from "@/lib/products";

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
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const cat = categories[category as CategoryKey];
  if (!cat) notFound();

  // Deliberately the full catalogue, not just this category: CatalogExplorer
  // derives its own facet chips from the array it receives, and `lockedCategory`
  // is what narrows the grid. Pre-filtering here would make the chips
  // under-count. Phase 7's server-filtered browser is the fix at scale.
  const products = await getCatalogProducts();

  return (
    <>
      <PageHero eyebrow={cat.eyebrow} title={cat.title} description={cat.description} />
      <CatalogExplorer products={products} lockedCategory={category as CatalogProduct["category"]} />
    </>
  );
}
