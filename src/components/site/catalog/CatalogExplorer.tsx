"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, SlidersHorizontal, X } from "lucide-react";
import type { Application, CatalogProduct } from "@/lib/catalog";
import { ProductCard } from "@/components/site/catalog/ProductCard";
import { FilterChip } from "@/components/site/catalog/FilterChip";
import { QuickView } from "@/components/site/catalog/QuickView";
import { applicationIcons } from "@/components/site/catalog/ApplicationBadge";
import { cn } from "@/lib/utils";

const categoryLabels: Record<CatalogProduct["category"], string> = {
  tiles: "Tiles",
  sanitary: "Sanitaryware",
  "designer-picks": "Designer Picks",
};

interface CatalogExplorerProps {
  products: CatalogProduct[];
  lockedCategory?: CatalogProduct["category"];
}

export function CatalogExplorer({ products, lockedCategory }: CatalogExplorerProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | null>(lockedCategory ?? null);
  const [application, setApplication] = useState<Application | null>(null);
  const [brand, setBrand] = useState<string | null>(null);
  const [finish, setFinish] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [quickView, setQuickView] = useState<CatalogProduct | null>(null);

  const scoped = lockedCategory ? products.filter((p) => p.category === lockedCategory) : products;

  const applications = useMemo(
    () => Array.from(new Set(scoped.flatMap((p) => p.applications))).sort(),
    [scoped]
  );
  const brands = useMemo(() => Array.from(new Set(scoped.map((p) => p.brand))).sort(), [scoped]);
  const finishes = useMemo(() => Array.from(new Set(scoped.map((p) => p.finish))).sort(), [scoped]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return scoped.filter((p) => {
      if (category && p.category !== category) return false;
      if (application && !p.applications.includes(application)) return false;
      if (brand && p.brand !== brand) return false;
      if (finish && p.finish !== finish) return false;
      if (q) {
        const haystack = `${p.name} ${p.collection} ${p.brand} ${p.description}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [scoped, category, application, brand, finish, search]);

  const activeCount = [category && !lockedCategory, application, brand, finish].filter(Boolean).length;

  function clearAll() {
    if (!lockedCategory) setCategory(null);
    setApplication(null);
    setBrand(null);
    setFinish(null);
    setSearch("");
  }

  return (
    <>
      {/* Sticky filter bar */}
      <div className="sticky top-20 z-30 -mx-6 border-b hairline bg-ivory/90 px-6 py-4 backdrop-blur-xl md:-mx-10 md:px-10 lg:-mx-14 lg:px-14">
        <div className="mx-auto max-w-[110rem]">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search collections, brands, finishes…"
                aria-label="Search catalogue"
                className="w-full rounded-full border border-ink/10 bg-white py-2.5 pl-11 pr-4 text-sm outline-none transition-colors focus:border-gold"
              />
            </div>

            {/* Room chips — primary, always visible */}
            <div className="flex flex-1 items-center gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none]">
              <FilterChip
                group="application"
                label="All Rooms"
                active={application === null}
                onClick={() => setApplication(null)}
              />
              {applications.map((app) => {
                const Icon = applicationIcons[app];
                return (
                  <FilterChip
                    key={app}
                    group="application"
                    label={app}
                    active={application === app}
                    onClick={() => setApplication(application === app ? null : app)}
                    icon={<Icon className="h-3.5 w-3.5" />}
                  />
                );
              })}
            </div>

            {/* Expand toggle */}
            <button
              onClick={() => setExpanded((v) => !v)}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition-colors duration-300",
                expanded || activeCount > 0
                  ? "border-ink bg-ink text-ivory"
                  : "border-ink/12 text-slate-warm hover:border-ink/30"
              )}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filters
              {activeCount > 0 && (
                <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-gold text-[0.65rem] font-bold text-ivory">
                  {activeCount}
                </span>
              )}
            </button>
          </div>

          {/* Expanded refine panel */}
          <AnimatePresence initial={false}>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <div className="flex flex-col gap-4 pt-5">
                  {!lockedCategory && (
                    <FilterRow label="Category">
                      <FilterChip
                        group="category"
                        label="All"
                        active={category === null}
                        onClick={() => setCategory(null)}
                      />
                      {(Object.keys(categoryLabels) as CatalogProduct["category"][]).map((c) => (
                        <FilterChip
                          key={c}
                          group="category"
                          label={categoryLabels[c]}
                          active={category === c}
                          onClick={() => setCategory(category === c ? null : c)}
                        />
                      ))}
                    </FilterRow>
                  )}
                  <FilterRow label="Brand">
                    <FilterChip group="brand" label="All" active={brand === null} onClick={() => setBrand(null)} />
                    {brands.map((b) => (
                      <FilterChip
                        key={b}
                        group="brand"
                        label={b}
                        active={brand === b}
                        onClick={() => setBrand(brand === b ? null : b)}
                      />
                    ))}
                  </FilterRow>
                  <FilterRow label="Finish">
                    <FilterChip group="finish" label="All" active={finish === null} onClick={() => setFinish(null)} />
                    {finishes.map((f) => (
                      <FilterChip
                        key={f}
                        group="finish"
                        label={f}
                        active={finish === f}
                        onClick={() => setFinish(finish === f ? null : f)}
                      />
                    ))}
                  </FilterRow>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Results */}
      <div className="bg-ivory py-14 md:py-20">
        <div className="mx-auto max-w-[110rem] px-6 md:px-10 lg:px-14">
          <div className="mb-10 flex items-center justify-between">
            <p className="text-sm text-stone-400">
              {filtered.length} {filtered.length === 1 ? "piece" : "pieces"} in the collection
            </p>
            {(activeCount > 0 || search) && (
              <button
                onClick={clearAll}
                className="flex items-center gap-1.5 text-sm text-slate-warm transition-colors hover:text-gold"
              >
                <X className="h-3.5 w-3.5" />
                Clear filters
              </button>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center rounded-3xl border border-dashed hairline py-24 text-center">
              <p className="text-lg font-medium text-ink">No pieces match those filters</p>
              <p className="mt-2 text-slate-warm">Try clearing a filter or searching something else.</p>
            </div>
          ) : (
            <div className="columns-1 gap-6 sm:columns-2 xl:columns-3 [&>*]:mb-6">
              <AnimatePresence mode="popLayout">
                {filtered.map((product) => (
                  <motion.div
                    key={product.slug}
                    layout
                    initial={{ opacity: 0, y: 28 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                    className="break-inside-avoid"
                  >
                    <ProductCard product={product} onQuickView={setQuickView} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      <QuickView product={quickView} onClose={() => setQuickView(null)} />
    </>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">
        {label}
      </span>
      {children}
    </div>
  );
}
