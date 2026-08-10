"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Search, SlidersHorizontal, X, LayoutGrid, List } from "lucide-react";
import type { Application, CatalogProduct } from "@/lib/catalog";
import { ProductCard } from "@/components/site/catalog/ProductCard";
import { FilterChip } from "@/components/site/catalog/FilterChip";
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
  const [availability, setAvailability] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [expanded, setExpanded] = useState(false);

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
      if (availability === "In Stock" && p.tag !== "Bestseller" && p.tag !== "New Arrival") return false;
      if (availability === "Sample Available" && p.tag !== "Designer Pick" && p.tag !== "Premium") return false;
      if (q) {
        const haystack = `${p.name} ${p.collection} ${p.brand} ${p.description}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [scoped, category, application, brand, finish, availability, search]);

  const activeCount = [category && !lockedCategory, application, brand, finish, availability].filter(Boolean).length;

  function clearAll() {
    if (!lockedCategory) setCategory(null);
    setApplication(null);
    setBrand(null);
    setFinish(null);
    setAvailability(null);
    setSearch("");
  }

  return (
    <>
      {/* Filter bar (static to scroll naturally with the page and avoid overlap) */}
      <div className="relative z-10 -mx-6 border-b border-stone-200 bg-white px-6 py-3 md:-mx-10 md:px-10 lg:-mx-14 lg:px-14">
        <div className="mx-auto max-w-[110rem]">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative min-w-[180px] max-w-xs md:max-w-sm flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search collections, brands…"
                aria-label="Search catalogue"
                className="w-full rounded-full border border-stone-200 bg-offwhite py-1.5 pl-9 pr-3 text-xs font-medium outline-none transition-colors focus:border-accent focus:bg-white"
              />
            </div>

            {/* Room chips */}
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
                    icon={<Icon className="h-3 w-3" />}
                  />
                );
              })}
            </div>

            {/* Grid vs List view toggle */}
            <div className="hidden sm:flex items-center gap-1 rounded-full border border-stone-200 p-0.5 bg-offwhite">
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "p-1 rounded-full transition-colors",
                  viewMode === "grid" ? "bg-accent text-ink" : "text-stone-400 hover:text-ink"
                )}
                aria-label="Grid view"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "p-1 rounded-full transition-colors",
                  viewMode === "list" ? "bg-accent text-ink" : "text-stone-400 hover:text-ink"
                )}
                aria-label="List view"
              >
                <List className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Expand toggle */}
            <button
              onClick={() => setExpanded((v) => !v)}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold transition-colors duration-300",
                expanded || activeCount > 0
                  ? "border-ink bg-ink text-white"
                  : "border-stone-200 text-slate-warm hover:border-accent"
              )}
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-accent" />
              Filters
              {activeCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-ink">
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
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <div className="flex flex-col gap-4 pt-5 border-t border-stone-200 mt-4">
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
                  <FilterRow label="Availability">
                    <FilterChip
                      group="avail"
                      label="All Stock"
                      active={availability === null}
                      onClick={() => setAvailability(null)}
                    />
                    <FilterChip
                      group="avail"
                      label="In Stock Slabs"
                      active={availability === "In Stock"}
                      onClick={() => setAvailability(availability === "In Stock" ? null : "In Stock")}
                    />
                    <FilterChip
                      group="avail"
                      label="Sample Box Available"
                      active={availability === "Sample Available"}
                      onClick={() => setAvailability(availability === "Sample Available" ? null : "Sample Available")}
                    />
                  </FilterRow>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Results Grid / List */}
      <div className="bg-white py-14 md:py-20">
        <div className="mx-auto max-w-[110rem] px-6 md:px-10 lg:px-14">
          <div className="mb-8 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-warm">
              Showing <span className="text-ink font-bold">{filtered.length}</span> curated luxury pieces
            </p>
            {(activeCount > 0 || search) && (
              <button
                onClick={clearAll}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-warm hover:text-ink transition-colors"
              >
                <X className="h-3.5 w-3.5 text-accent" />
                Clear All Filters
              </button>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center rounded-3xl border border-dashed border-stone-300 bg-offwhite py-24 text-center">
              <p className="text-xl font-bold text-ink">No matching products found</p>
              <p className="mt-2 text-sm text-slate-warm">Try resetting filters or searching broad keywords.</p>
              <button
                onClick={clearAll}
                className="mt-6 rounded-xl bg-ink px-6 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-accent hover:text-ink transition-colors"
              >
                Reset Catalog Filters
              </button>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5">
              <AnimatePresence mode="popLayout">
                {filtered.map((product) => (
                  <motion.div
                    key={product.slug}
                    layout
                    initial={{ opacity: 0, y: 28 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.4 }}
                  >
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((product) => (
                <div
                  key={product.slug}
                  className="flex flex-col md:flex-row items-center gap-6 rounded-2xl border border-stone-200 bg-white p-4 shadow-soft hover:shadow-float hover:border-accent transition-all"
                >
                  <div className="relative h-40 w-full md:w-56 shrink-0 overflow-hidden rounded-xl bg-stone-100">
                    <Image
                      src={product.lifestyleImage}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold uppercase tracking-wider text-accent">
                      {product.brand} • {product.collection}
                    </span>
                    <h3 className="text-xl font-bold text-ink">{product.name}</h3>
                    <p className="text-xs text-slate-warm mt-1">{product.description}</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <span className="rounded-full bg-offwhite px-3 py-1 text-xs font-medium text-ink border border-stone-200">
                        Finish: {product.finish}
                      </span>
                      <span className="rounded-full bg-offwhite px-3 py-1 text-xs font-medium text-ink border border-stone-200">
                        Thickness: {product.thickness}
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0 flex gap-2 w-full md:w-auto">
                    <Link
                      href={`/products/${product.category}/${product.slug}`}
                      className="flex-1 md:flex-initial rounded-xl bg-ink px-4 py-2.5 text-xs font-bold text-white hover:bg-accent hover:text-ink transition-colors text-center flex items-center justify-center"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-2 text-xs font-bold uppercase tracking-wider text-stone-400">
        {label}
      </span>
      {children}
    </div>
  );
}

