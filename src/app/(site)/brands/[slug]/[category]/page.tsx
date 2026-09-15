import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { CatalogResults } from "@/components/site/catalog/CatalogResults";
import { Breadcrumbs, type Crumb } from "@/components/site/catalog/Breadcrumbs";
import {
  getBrandBySlug,
  getBrandCategoryTree,
  getCategoryAncestors,
  getCategoryBranchIds,
  getCategoryBySlug,
  flattenCategories,
} from "@/lib/catalog-taxonomy";
import { normalizePerPage, searchCatalog } from "@/lib/catalog-search";
import { absoluteUrl } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const revalidate = 600;

/** "/brands/jaquar/all" — every product of one brand, no category filter. */
const ALL = "all";

type RouteParams = { slug: string; category: string };
type SearchParams = Record<string, string | string[] | undefined>;

async function resolve(slug: string, category: string) {
  const brand = await getBrandBySlug(slug);
  if (!brand) return null;

  if (category === ALL) {
    return { brand, category: null, branchIds: undefined };
  }

  const cat = await getCategoryBySlug(category);
  if (!cat) return null;

  const branchIds = await getCategoryBranchIds(cat.id);

  // Only serve the combination if this brand actually has products in it.
  // A URL for a category the brand does not sell is a 404, not an empty grid.
  const count = await searchCatalog({
    brandSlug: brand.slug,
    categoryIds: branchIds,
    page: 1,
    perPage: 1,
  });
  if (count.total === 0) return null;

  return { brand, category: cat, branchIds };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { slug, category } = await params;
  const resolved = await resolve(slug, category);
  if (!resolved) return { title: "Not found" };

  const { brand, category: cat } = resolved;
  const title = cat ? `${brand.name} ${cat.name}` : `All ${brand.name} products`;

  return {
    title,
    description:
      cat?.description ??
      `Browse ${title} at Prestige — sizes, finishes and collections available to order.`,
    alternates: { canonical: absoluteUrl(`/brands/${brand.slug}/${category}`) },
    // Filtered and paged views share the canonical above; they must not become
    // thousands of separately indexed URLs.
    robots: { index: true, follow: true },
  };
}

export default async function BrandCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<RouteParams>;
  searchParams: Promise<SearchParams>;
}) {
  const { slug, category } = await params;
  const sp = await searchParams;
  const resolved = await resolve(slug, category);
  if (!resolved) notFound();

  const { brand, category: cat, branchIds } = resolved;
  const one = (k: string) => (typeof sp[k] === "string" && sp[k] ? (sp[k] as string) : undefined);

  const page = Math.max(1, Number(one("page") ?? 1) || 1);
  const perPage = normalizePerPage(Number(one("perPage")) || undefined);
  const sortParam = one("sort");

  const [result, siblings, ancestors] = await Promise.all([
    searchCatalog({
      brandSlug: brand.slug,
      categoryIds: branchIds,
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
    }),
    getBrandCategoryTree(brand.id),
    cat ? getCategoryAncestors(cat.id) : Promise.resolve([]),
  ]);

  const base = `/brands/${brand.slug}/${category}`;
  const params_ = Object.fromEntries(
    Object.entries(sp).filter(([, v]) => typeof v === "string")
  ) as Record<string, string | undefined>;

  const crumbs: Crumb[] = [
    { label: "Home", href: "/" },
    { label: "Brands", href: "/brands" },
    { label: brand.name, href: `/brands/${brand.slug}` },
    ...(cat
      ? ancestors.map((a, i) =>
          i === ancestors.length - 1
            ? { label: a.name }
            : { label: a.name, href: `/brands/${brand.slug}/${a.slug}` }
        )
      : [{ label: "All products" }]),
  ];

  // Sibling categories the brand actually sells in — lateral navigation
  // without leaving the brand.
  const siblingNodes = flattenCategories(siblings).filter((n) => n.children.length === 0);

  return (
    <main className="bg-ivory pb-24">
      <section className="border-b hairline bg-canvas">
        <Container size="wide" className="py-10 md:py-14">
          <Breadcrumbs items={crumbs} className="mb-6" />
          <h1 className="text-display-sm tracking-tight text-ink">
            {cat ? `${brand.name} ${cat.name}` : `All ${brand.name} products`}
          </h1>
          <p className="mt-2 text-[0.9rem] text-ink/50">
            {result.total.toLocaleString("en-IN")} {result.total === 1 ? "product" : "products"}
          </p>

          {siblingNodes.length > 1 && (
            <div className="mt-7 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <Link
                href={`/brands/${brand.slug}/${ALL}`}
                className={cn(
                  "shrink-0 rounded-full px-4 py-1.5 text-[0.8rem] transition-colors",
                  category === ALL
                    ? "bg-ink text-ivory"
                    : "border hairline text-ink/60 hover:border-gold hover:text-gold"
                )}
              >
                All
              </Link>
              {siblingNodes.map((n) => (
                <Link
                  key={n.id}
                  href={`/brands/${brand.slug}/${n.slug}`}
                  className={cn(
                    "shrink-0 rounded-full px-4 py-1.5 text-[0.8rem] transition-colors",
                    n.slug === category
                      ? "bg-ink text-ivory"
                      : "border hairline text-ink/60 hover:border-gold hover:text-gold"
                  )}
                >
                  {n.name}
                  <span className="ml-1.5 text-[0.7rem] tabular-nums opacity-55">{n.productCount}</span>
                </Link>
              ))}
            </div>
          )}
        </Container>
      </section>

      <Container size="wide" className="pt-12">
        <CatalogResults
          result={result}
          base={base}
          params={params_}
          // Every result here is this brand, so a brand filter would be a
          // control that can only ever narrow to what is already shown.
          showBrandFilter={false}
          emptyMessage={`No ${brand.name} products match these filters.`}
        />
      </Container>
    </main>
  );
}
