import type { Metadata } from "next";
import { CatalogueHero } from "@/components/site/catalog/CatalogueHero";
import { CollectionsGrid } from "@/components/site/catalog/CollectionsGrid";
import { getCollections } from "@/lib/collections";
import { applySeo, getSeoForPath } from "@/lib/seo";
import { buildCategoryMetadata } from "@/lib/seo-metadata";

/**
 * The collections index.
 *
 * This page used to render six hardcoded "collections" — Lumina Marble,
 * Volcanica Basalt, Antico Stone and three more — with stock photography,
 * invented counts ("14 Slabs") and invented finishes. None of them existed in
 * the catalogue: every "Explore Collection" button led to a filtered listing
 * that matched zero products. It now renders the twenty real ranges the
 * database holds, each linking to its own page.
 */

export const revalidate = 600;

export async function generateMetadata(): Promise<Metadata> {
  const collections = await getCollections();
  const path = "/collections";
  const base = buildCategoryMetadata({
    name: "Collections",
    path,
    qualifier: "Curated Ranges",
    count: collections.length,
    description:
      collections.length > 0
        ? `Browse ${collections.length} curated ranges — ${collections
            .slice(0, 3)
            .map((c) => c.name)
            .join(", ")} and more — across tiles, bathware and sanitaryware at Prestige.`
        : undefined,
  });
  return applySeo(base, await getSeoForPath(path), path);
}

export default async function CollectionsPage() {
  const collections = await getCollections();

  return (
    <main className="min-h-screen bg-white">
      <CatalogueHero
        eyebrow="CURATED DESIGN FAMILIES"
        title={"Architectural\nCollections."}
        description="Explore the ranges we carry, grouped as the manufacturers design them — one material language, every format and finish in it."
        heroImage={collections.find((c) => c.image)?.image ?? undefined}
      />
      <CollectionsGrid collections={collections} />
    </main>
  );
}
