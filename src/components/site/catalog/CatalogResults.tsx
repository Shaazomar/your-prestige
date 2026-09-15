import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard } from "@/components/site/catalog/ProductCard";
import { PER_PAGE_OPTIONS, type CatalogSearchResult } from "@/lib/catalog-search";
import { cn } from "@/lib/utils";

type Params = Record<string, string | undefined>;

/**
 * Server-rendered catalogue results: filters, grid and pagination.
 *
 * Every control is a link, not client state. At five to six thousand products
 * the browser must never hold the catalogue — each view is one scoped,
 * paginated query, and the URL is the whole of the state, which also makes
 * every filtered view shareable and back-button-correct.
 */

function href(base: string, params: Params, changes: Params): string {
  const next = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...params, ...changes })) {
    if (v) next.set(k, v);
  }
  // Any change of filter or page size returns to the first page; staying on
  // page 7 of a result set that now has 3 pages is a dead end.
  if (!("page" in changes)) next.delete("page");
  const qs = next.toString();
  return qs ? `${base}?${qs}` : base;
}

function FacetGroup({
  title,
  param,
  options,
  base,
  params,
}: {
  title: string;
  param: string;
  options: { value: string; count: number }[];
  base: string;
  params: Params;
}) {
  // A facet with one option filters nothing; showing it is just noise. This is
  // how "only the filters relevant to this category" stays true to the data
  // rather than depending on a hand-maintained list per category.
  if (options.length < 2) return null;
  const active = params[param];

  return (
    <div className="border-b hairline py-5 last:border-b-0">
      <p className="mb-3 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-ink/40">
        {title}
      </p>
      <ul className="flex flex-wrap gap-1.5 lg:flex-col lg:gap-0.5">
        {options.slice(0, 14).map((o) => {
          const on = active === o.value;
          return (
            <li key={o.value}>
              <Link
                href={href(base, params, { [param]: on ? undefined : o.value })}
                aria-pressed={on}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[0.8rem] transition-colors duration-200 lg:rounded-lg lg:px-2",
                  on
                    ? "bg-ink text-ivory"
                    : "bg-ink/[0.04] text-ink/70 hover:bg-ink/[0.08] hover:text-ink lg:bg-transparent"
                )}
              >
                <span className="truncate">{o.value}</span>
                <span className={cn("text-[0.7rem] tabular-nums", on ? "text-ivory/50" : "text-ink/30")}>
                  {o.count}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function CatalogResults({
  result,
  base,
  params,
  showBrandFilter = true,
  emptyMessage = "No products match these filters.",
}: {
  result: CatalogSearchResult;
  /** Route path the links are built on, e.g. "/brands/jaquar/faucets". */
  base: string;
  params: Params;
  /** Hidden on a brand-scoped route, where every result is that brand anyway. */
  showBrandFilter?: boolean;
  emptyMessage?: string;
}) {
  const { products, total, page, pageCount, perPage, facets } = result;
  const hasFilters = Object.entries(params).some(
    ([k, v]) => v && !["page", "perPage", "sort"].includes(k)
  );

  return (
    <div className="grid gap-10 lg:grid-cols-[15rem_1fr] lg:gap-14">
      {/* Filters — a scrollable row on mobile, a rail on desktop. */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="flex items-baseline justify-between">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-ink/40">
            Filter
          </p>
          {hasFilters && (
            <Link href={base} className="text-[0.75rem] text-gold hover:underline">
              Clear all
            </Link>
          )}
        </div>
        <div className="mt-1">
          {showBrandFilter && (
            <FacetGroup title="Brand" param="brand" options={facets.brands} base={base} params={params} />
          )}
          <FacetGroup title="Collection" param="collection" options={facets.collections} base={base} params={params} />
          <FacetGroup title="Size" param="size" options={facets.sizes} base={base} params={params} />
          <FacetGroup title="Finish" param="finish" options={facets.finishes} base={base} params={params} />
          <FacetGroup title="Colour" param="colour" options={facets.colors} base={base} params={params} />
          <FacetGroup title="Material" param="material" options={facets.materials} base={base} params={params} />
          <FacetGroup title="Space" param="room" options={facets.applications} base={base} params={params} />
        </div>
      </aside>

      <div>
        {/* Result count + page size + sort */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b hairline pb-4">
          <p className="text-[0.85rem] text-ink/50">
            <span className="font-medium text-ink/80 tabular-nums">{total.toLocaleString("en-IN")}</span>{" "}
            {total === 1 ? "product" : "products"}
            {pageCount > 1 && <span className="text-ink/35"> · page {page} of {pageCount}</span>}
          </p>

          <div className="flex items-center gap-5">
            <div className="flex items-center gap-1.5 text-[0.78rem] text-ink/40">
              <span className="hidden sm:inline">Show</span>
              {PER_PAGE_OPTIONS.map((n) => (
                <Link
                  key={n}
                  href={href(base, params, { perPage: n === PER_PAGE_OPTIONS[0] ? undefined : String(n) })}
                  className={cn(
                    "rounded px-1.5 py-0.5 tabular-nums transition-colors",
                    perPage === n ? "font-semibold text-ink" : "hover:text-ink"
                  )}
                >
                  {n}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-1.5 text-[0.78rem] text-ink/40">
              <span className="hidden sm:inline">Sort</span>
              {(
                [
                  ["featured", "Featured"],
                  ["newest", "Newest"],
                  ["name", "A–Z"],
                ] as const
              ).map(([value, label]) => (
                <Link
                  key={value}
                  href={href(base, params, { sort: value === "featured" ? undefined : value })}
                  className={cn(
                    "rounded px-1.5 py-0.5 transition-colors",
                    (params.sort ?? "featured") === value ? "font-semibold text-ink" : "hover:text-ink"
                  )}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="rounded-2xl border hairline bg-ink/[0.02] px-8 py-20 text-center">
            <p className="text-ink/55">{emptyMessage}</p>
            {hasFilters && (
              <Link href={base} className="mt-4 inline-block text-sm text-gold hover:underline">
                Clear the filters
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 xl:grid-cols-4">
            {products.map((p, i) => (
              <ProductCard key={p.slug} product={p} priority={i < 4} />
            ))}
          </div>
        )}

        {pageCount > 1 && <Pagination base={base} params={params} page={page} pageCount={pageCount} />}
      </div>
    </div>
  );
}

/** Windowed page links — never 200 numbers for a 5,000-product category. */
function Pagination({
  base,
  params,
  page,
  pageCount,
}: {
  base: string;
  params: Params;
  page: number;
  pageCount: number;
}) {
  const window = 2;
  const numbers: (number | "gap")[] = [];
  for (let n = 1; n <= pageCount; n++) {
    if (n === 1 || n === pageCount || Math.abs(n - page) <= window) numbers.push(n);
    else if (numbers[numbers.length - 1] !== "gap") numbers.push("gap");
  }

  const link = (n: number) => href(base, params, { page: n === 1 ? undefined : String(n) });

  return (
    <nav aria-label="Pagination" className="mt-14 flex items-center justify-center gap-1.5">
      <Link
        href={link(Math.max(1, page - 1))}
        aria-label="Previous page"
        aria-disabled={page === 1}
        className={cn(
          "grid h-9 w-9 place-items-center rounded-full border hairline transition-colors",
          page === 1 ? "pointer-events-none opacity-30" : "hover:border-gold hover:text-gold"
        )}
      >
        <ChevronLeft className="h-4 w-4" />
      </Link>

      {numbers.map((n, i) =>
        n === "gap" ? (
          <span key={`gap-${i}`} className="px-1 text-ink/25">
            …
          </span>
        ) : (
          <Link
            key={n}
            href={link(n)}
            aria-current={n === page ? "page" : undefined}
            className={cn(
              "grid h-9 min-w-9 place-items-center rounded-full px-2 text-[0.85rem] tabular-nums transition-colors",
              n === page ? "bg-ink font-medium text-ivory" : "border hairline hover:border-gold hover:text-gold"
            )}
          >
            {n}
          </Link>
        )
      )}

      <Link
        href={link(Math.min(pageCount, page + 1))}
        aria-label="Next page"
        aria-disabled={page === pageCount}
        className={cn(
          "grid h-9 w-9 place-items-center rounded-full border hairline transition-colors",
          page === pageCount ? "pointer-events-none opacity-30" : "hover:border-gold hover:text-gold"
        )}
      >
        <ChevronRight className="h-4 w-4" />
      </Link>
    </nav>
  );
}
