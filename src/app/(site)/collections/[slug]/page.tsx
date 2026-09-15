import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { CatalogBrowser } from "@/components/site/catalog/CatalogBrowser";
import { getCollectionBySlug, getCollections } from "@/lib/collections";
import { parseFilters, searchCatalog } from "@/lib/catalog-search";
import { applySeo, getSeoForPath } from "@/lib/seo";
import { buildCollectionMetadata } from "@/lib/seo-metadata";

/**
 * One named range across every brand that carries it — `/collections/fonte`.
 *
 * Built on the same `searchCatalog` engine as `/bathware/[category]` and
 * `/brands/[slug]/[category]`, so filtering, faceting and pagination behave
 * identically; only the locked scope differs.
 */

export const revalidate = 600;

export async function generateStaticParams() {
  try {
    const collections = await getCollections();
    return collections.slice(0, 100).map((c) => ({ slug: c.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const collection = await getCollectionBySlug(slug);
  if (!collection) return {};

  const path = `/collections/${collection.slug}`;
  const base = buildCollectionMetadata({
    name: collection.name,
    slug: collection.slug,
    brandName: collection.brandName,
    description: collection.description,
    count: collection.count,
    image: collection.image,
  });

  return applySeo(base, await getSeoForPath(path), path);
}

export default async function CollectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const collection = await getCollectionBySlug(slug);
  if (!collection) notFound();

  const sp = await searchParams;
  const result = await searchCatalog({ ...parseFilters(sp), collection: collection.name });

  return (
    <main className="min-h-screen bg-white">
      <section className="pb-4 pt-8">
        <Container size="wide">
          <Breadcrumbs
            items={[
              { label: "Collections", href: "/collections" },
              ...(collection.brandName && collection.brandSlug
                ? [{ label: collection.brandName, href: `/brands/${collection.brandSlug}` }]
                : []),
              { label: collection.name },
            ]}
          />
        </Container>
      </section>

      <CatalogBrowser
        result={result}
        lockedCollection={collection.name}
        eyebrow={collection.brandName ? `${collection.brandName} Collection` : "Collection"}
        title={collection.name}
        description={
          collection.description?.trim() ||
          `${collection.count} piece${collection.count === 1 ? "" : "s"} in the ${collection.name} range.`
        }
      />
    </main>
  );
}
