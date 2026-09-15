import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/site/PageHero";
import { RevealStagger, RevealItem } from "@/components/motion/Reveal";
import { SafeImage } from "@/components/ui/SafeImage";
import { CatalogResults } from "@/components/site/catalog/CatalogResults";
import { Breadcrumbs, type Crumb } from "@/components/site/catalog/Breadcrumbs";
import {
  getCategoryAncestors,
  getCategoryBranchIds,
  getCategoryBySlug,
  getCategoryTree,
  type CategoryNode,
} from "@/lib/catalog-taxonomy";
import { normalizePerPage, searchCatalog } from "@/lib/catalog-search";
import { absoluteUrl } from "@/lib/seo";

/**
 * Category-first browsing, shared by every top-level section.
 *
 * /tiles and /bathware are thin route files over this one implementation, so
 * the two can never drift apart, and a third section is a four-line folder
 * rather than a copy of a page. Unlike the brand routes these show products
 * from every brand, with the brand filter left switched on.
 */

type SearchParams = Record<string, string | string[] | undefined>;

async function findSection(sectionSlug: string) {
  const tree = await getCategoryTree();
  return tree.find((n) => n.slug === sectionSlug) ?? null;
}

export async function sectionMetadata(sectionSlug: string, fallbackTitle: string): Promise<Metadata> {
  const section = await findSection(sectionSlug);
  if (!section) return { title: fallbackTitle };

  return {
    title: section.name,
    description:
      section.description ??
      `Browse ${section.productCount.toLocaleString("en-IN")} ${section.name.toLowerCase()} products at Prestige, across every brand we carry.`,
    alternates: { canonical: absoluteUrl(`/${sectionSlug}`) },
  };
}

/** The section landing page: its categories as cards. */
export async function SectionLanding({
  sectionSlug,
  eyebrow,
}: {
  sectionSlug: string;
  eyebrow: string;
}) {
  const section = await findSection(sectionSlug);
  if (!section) notFound();

  const cards = section.children.length > 0 ? section.children : [section];

  return (
    <>
      <PageHero
        eyebrow={eyebrow}
        title={section.name}
        description={
          section.description ??
          `${section.productCount.toLocaleString("en-IN")} products across ${cards.length} categories.`
        }
      />

      <section className="bg-ivory pb-24 pt-10 md:pb-32">
        <Container size="wide">
          <Breadcrumbs
            items={[{ label: "Home", href: "/" }, { label: section.name }]}
            className="mb-10"
          />

          <RevealStagger
            className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4"
            stagger={0.04}
          >
            {cards.map((node) => (
              <RevealItem key={node.id}>
                <SectionCategoryCard sectionSlug={sectionSlug} node={node} />
              </RevealItem>
            ))}
          </RevealStagger>
        </Container>
      </section>
    </>
  );
}

function SectionCategoryCard({ sectionSlug, node }: { sectionSlug: string; node: CategoryNode }) {
  return (
    <Link
      href={`/${sectionSlug}/${node.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl border hairline bg-canvas transition-all duration-500 hover:-translate-y-0.5 hover:border-gold/40"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
        <SafeImage
          src={node.image ?? ""}
          alt={node.name}
          fill
          placeholderLabel={node.name}
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover transition-transform duration-[900ms] group-hover:scale-[1.04]"
        />
      </div>
      <div className="p-4">
        <p className="text-[0.9rem] font-medium leading-snug text-ink group-hover:text-gold">
          {node.name}
        </p>
        <p className="mt-1 text-[0.75rem] tabular-nums text-ink/40">
          {node.productCount.toLocaleString("en-IN")} products
        </p>
      </div>
    </Link>
  );
}

export async function sectionCategoryMetadata(
  sectionSlug: string,
  categorySlug: string
): Promise<Metadata> {
  const cat = await getCategoryBySlug(categorySlug);
  if (!cat) return { title: "Not found" };

  return {
    title: cat.name,
    description:
      cat.description ?? `Browse ${cat.name} at Prestige — every brand, size and finish we carry.`,
    alternates: { canonical: absoluteUrl(`/${sectionSlug}/${categorySlug}`) },
  };
}

/** A category page within a section: products from every brand. */
export async function SectionCategory({
  sectionSlug,
  categorySlug,
  searchParams,
}: {
  sectionSlug: string;
  categorySlug: string;
  searchParams: SearchParams;
}) {
  const [section, cat] = await Promise.all([
    findSection(sectionSlug),
    getCategoryBySlug(categorySlug),
  ]);
  if (!section || !cat) notFound();

  // The category has to actually live under this section. Without this check
  // /tiles/faucets and /bathware/gvt both answered 200, serving bathware under
  // the tiles URL and vice versa — two addresses for the same products, and
  // two canonicals competing for them.
  const [branchIds, ancestry] = await Promise.all([
    getCategoryBranchIds(cat.id),
    getCategoryAncestors(cat.id),
  ]);
  if (!ancestry.some((a) => a.id === section.id)) notFound();
  const sp = searchParams;
  const one = (k: string) => (typeof sp[k] === "string" && sp[k] ? (sp[k] as string) : undefined);

  const page = Math.max(1, Number(one("page") ?? 1) || 1);
  const perPage = normalizePerPage(Number(one("perPage")) || undefined);
  const sortParam = one("sort");

  const result = await searchCatalog({
      categoryIds: branchIds,
      brand: one("brand"),
      collection: one("collection"),
      finish: one("finish"),
      material: one("material"),
      color: one("colour"),
      size: one("size"),
      application: one("room"),
      q: one("q"),
      page,
      perPage,
      sort: sortParam === "newest" || sortParam === "name" ? sortParam : "featured",
  });
  const ancestors = ancestry;

  // A category URL that holds nothing is not a page.
  if (result.total === 0 && Object.keys(sp).length === 0) notFound();

  const base = `/${sectionSlug}/${categorySlug}`;
  const params_ = Object.fromEntries(
    Object.entries(sp).filter(([, v]) => typeof v === "string")
  ) as Record<string, string | undefined>;

  const crumbs: Crumb[] = [
    { label: "Home", href: "/" },
    ...ancestors.map((a, i) =>
      i === ancestors.length - 1 ? { label: a.name } : { label: a.name, href: `/${sectionSlug}/${a.slug}` }
    ),
  ];
  // The section itself is the first ancestor; point it at the section landing.
  if (crumbs[1]) crumbs[1] = { label: section.name, href: `/${sectionSlug}` };

  return (
    <main className="bg-ivory pb-24">
      <section className="border-b hairline bg-canvas">
        <Container size="wide" className="py-10 md:py-14">
          <Breadcrumbs items={crumbs} className="mb-6" />
          <h1 className="text-display-sm tracking-tight text-ink">{cat.name}</h1>
          <p className="mt-2 text-[0.9rem] text-ink/50">
            {result.total.toLocaleString("en-IN")} {result.total === 1 ? "product" : "products"}
            {result.facets.brands.length > 1 && ` from ${result.facets.brands.length} brands`}
          </p>
        </Container>
      </section>

      <Container size="wide" className="pt-12">
        <CatalogResults
          result={result}
          base={base}
          params={params_}
          emptyMessage={`No ${cat.name.toLowerCase()} match these filters.`}
        />
      </Container>
    </main>
  );
}
