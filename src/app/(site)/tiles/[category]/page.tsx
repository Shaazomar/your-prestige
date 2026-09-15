import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { CatalogBrowser } from "@/components/site/catalog/CatalogBrowser";
import { getTileCategories } from "@/lib/brands";
import { parseFilters, searchCatalog } from "@/lib/catalog-search";
import { siteUrl } from "@/lib/site-config";

/**
 * One tile category across every brand — e.g. `/tiles/gvt` shows Motto,
 * Velzone and Lonix GVT together. The mirror of `/bathware/[category]`, built
 * on the same helper so the two sections cannot drift apart.
 */

export const revalidate = 600;

export async function generateStaticParams() {
  try {
    const categories = await getTileCategories();
    return categories.map((c) => ({ category: c.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const categories = await getTileCategories();
  const cat = categories.find((c) => c.slug === category);
  if (!cat) return {};
  return {
    title: `${cat.name} — Tiles & Surfaces`,
    description: `${cat.count} ${cat.name.toLowerCase()} across every brand we carry, at Your Prestige, Mangaluru.`,
    alternates: { canonical: `${siteUrl}/tiles/${cat.slug}` },
  };
}

export default async function TilesCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { category } = await params;
  const categories = await getTileCategories();
  const cat = categories.find((c) => c.slug === category);
  // A category that is not in the tiles subtree is not a tiles URL — without
  // this, /tiles/faucets would serve bathware under a tiles address, giving
  // the same products two URLs and two competing canonicals.
  if (!cat) notFound();

  const sp = await searchParams;
  const result = await searchCatalog({ ...parseFilters(sp), category: cat.slug });

  return (
    <main className="min-h-screen bg-white">
      <section className="pb-4 pt-8">
        <Container size="wide">
          <Breadcrumbs items={[{ label: "Tiles", href: "/tiles" }, { label: cat.name }]} />
        </Container>
      </section>

      <CatalogBrowser
        result={result}
        lockedCategory={cat.slug}
        eyebrow="Surface Collection"
        title={cat.name}
        description={`${cat.count} ${cat.name.toLowerCase()} piece${cat.count === 1 ? "" : "s"} across every brand we carry.`}
      />
    </main>
  );
}
