import type { Metadata } from "next";
import { PageHero } from "@/components/site/PageHero";
import { CatalogExplorer } from "@/components/site/catalog/CatalogExplorer";
import { products } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "The Catalogue",
  description:
    "Explore Your Prestige's full catalogue — premium tiles, luxury sanitaryware and designer picks from 40+ world-class brands, filterable by room, brand and finish.",
};

export default function ProductsPage() {
  return (
    <>
      <PageHero
        eyebrow="The Catalogue"
        title="An archive worth exploring."
        description="Filter by room, brand or finish — then step into the showroom to see every piece at full scale."
      />
      <CatalogExplorer products={products} />
    </>
  );
}
