import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { CatalogBrowser } from "@/components/site/catalog/CatalogBrowser";
import { getSectionCategory, getSectionCategoryTree } from "@/lib/brands";
import { parseFilters, searchCatalog } from "@/lib/catalog-search";
import { applySeo, getSeoForPath } from "@/lib/seo";
import { buildCategoryMetadata } from "@/lib/seo-metadata";

/**
 * One tile category across every brand — e.g. `/tiles/gvt` shows Motto,
 * Velzone and Lonix GVT together. The mirror of `/bathware/[category]`, built
 * on the same helper so the two sections cannot drift apart.
 */

export const revalidate = 600;

export async function generateStaticParams() {
  try {
    const categories = await getSectionCategoryTree("tiles");
    return categories.map((c) => ({ category: c.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const { category } = await params;
  const cat = await getSectionCategory("tiles", category);
  if (!cat) return {};

  const path = `/tiles/${cat.slug}`;
  const base = buildCategoryMetadata({
    name: cat.name,
    path,
    qualifier: "Tiles & Surfaces",
    count: cat.count,
    searchParams: await searchParams,
  });

  return applySeo(base, await getSeoForPath(path), path);
}

export default async function TilesCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { category } = await params;
  const cat = await getSectionCategory("tiles", category);
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
          <Breadcrumbs
            items={[
              { label: "Tiles", href: "/tiles" },
              // A third-level category sits under a second-level one; the
              // trail says so rather than flattening the tree.
              ...(cat.parentSlug && cat.parentName
                ? [{ label: cat.parentName, href: `/tiles/${cat.parentSlug}` }]
                : []),
              { label: cat.name },
            ]}
          />
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
