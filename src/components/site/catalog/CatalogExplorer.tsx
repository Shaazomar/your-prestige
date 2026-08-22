"use client";

import { useMemo, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Search, SlidersHorizontal, X, LayoutGrid, List, RotateCcw } from "lucide-react";
import type { CatalogProduct } from "@/lib/catalog";
import { ProductCard } from "@/components/site/catalog/ProductCard";
import { CatalogueHero } from "@/components/site/catalog/CatalogueHero";
import { cn } from "@/lib/utils";

const ROOM_OPTIONS = [
  "All Rooms",
  "Bathroom",
  "Bedroom",
  "Commercial",
  "Hotel",
  "Kitchen",
  "Living Room",
  "Office",
  "Outdoor",
  "Restaurant",
];

interface CatalogExplorerProps {
  products: CatalogProduct[];
  lockedCategory?: CatalogProduct["category"];
  eyebrow?: string;
  title?: string;
  description?: string;
}

export function CatalogExplorer({
  products,
  lockedCategory,
  eyebrow,
  title,
  description,
}: CatalogExplorerProps) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [category, setCategory] = useState<string | null>(lockedCategory ?? null);
  const [room, setRoom] = useState<string>("All Rooms");
  const [brand, setBrand] = useState<string | null>(null);
  const [finish, setFinish] = useState<string | null>(null);
  const [availability, setAvailability] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<string>("featured");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [applyingFilters, setApplyingFilters] = useState(false);

  // Handle debounced search with loading feedback
  useEffect(() => {
    setIsSearching(true);
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setIsSearching(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const scoped = lockedCategory ? products.filter((p) => p.category === lockedCategory) : products;

  const brands = useMemo(() => Array.from(new Set(scoped.map((p) => p.brand))).sort(), [scoped]);
  const finishes = useMemo(() => Array.from(new Set(scoped.map((p) => p.finish))).sort(), [scoped]);

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    let result = scoped.filter((p) => {
      if (category && p.category !== category) return false;
      if (room !== "All Rooms" && !p.applications.some((app) => app.toLowerCase().includes(room.toLowerCase())))
        return false;
      if (brand && p.brand !== brand) return false;
      if (finish && p.finish !== finish) return false;
      if (availability === "In Stock" && p.tag !== "Bestseller" && p.tag !== "New Arrival") return false;
      if (availability === "Sample Available" && p.tag !== "Designer Pick" && p.tag !== "Premium") return false;
      if (q) {
        const haystack = `${p.name} ${p.collection} ${p.brand} ${p.finish} ${p.description}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    // Sorting
    if (sortOption === "newest") {
      result = [...result].reverse();
    } else if (sortOption === "name-asc") {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortOption === "name-desc") {
      result = [...result].sort((a, b) => b.name.localeCompare(a.name));
    }

    return result;
  }, [scoped, category, room, brand, finish, availability, debouncedSearch, sortOption]);

  const activeCount = [
    category && !lockedCategory,
    room !== "All Rooms",
    brand,
    finish,
    availability,
  ].filter(Boolean).length;

  function clearAll() {
    if (!lockedCategory) setCategory(null);
    setRoom("All Rooms");
    setBrand(null);
    setFinish(null);
    setAvailability(null);
    setSearch("");
  }

  function handleApplyFilters() {
    setApplyingFilters(true);
    setTimeout(() => {
      setApplyingFilters(false);
      setDrawerOpen(false);
    }, 300);
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Editorial Catalogue Hero */}
      <CatalogueHero
        eyebrow={eyebrow}
        title={title}
        description={description}
      />

      {/* Floating Filter & Search Control Panel */}
      <div className="relative z-20 mx-auto max-w-[110rem] px-4 sm:px-6 lg:px-10 -mt-2 mb-10">
        <div className="rounded-3xl border border-stone-200/80 bg-white p-4 sm:p-5 shadow-[0_8px_30px_rgba(0,0,0,0.06)] space-y-4">
          {/* Search + Actions Bar */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tiles, collections, finishes…"
                aria-label="Search catalogue"
                className="w-full rounded-full border border-stone-200 bg-stone-50/70 py-2.5 pl-11 pr-4 text-xs font-medium outline-none transition-all focus:border-gold focus:bg-white"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-ink"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Filter Drawer Toggle Button */}
            <button
              onClick={() => setDrawerOpen(true)}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-xs font-bold transition-all duration-300 shadow-xs",
                activeCount > 0
                  ? "border-ink bg-ink text-white"
                  : "border-stone-200 bg-white text-stone-700 hover:border-gold hover:text-gold"
              )}
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-gold" />
              <span>Filters</span>
              {activeCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gold text-[10px] font-bold text-ink">
                  {activeCount}
                </span>
              )}
            </button>

            {/* Custom Sort Select */}
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="rounded-full border border-stone-200 bg-white px-4 py-2.5 text-xs font-semibold text-stone-700 outline-none transition-colors hover:border-stone-300 focus:border-gold cursor-pointer"
            >
              <option value="featured">Most Popular</option>
              <option value="newest">Newest</option>
              <option value="name-asc">Name A–Z</option>
              <option value="name-desc">Name Z–A</option>
            </select>

            {/* Segmented View Switcher */}
            <div className="hidden sm:flex items-center gap-1 rounded-full border border-stone-200 bg-stone-100/70 p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full transition-all",
                  viewMode === "grid" ? "bg-black text-white shadow-xs" : "text-stone-500 hover:text-ink"
                )}
                aria-label="Grid view"
                title="Grid View"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full transition-all",
                  viewMode === "list" ? "bg-black text-white shadow-xs" : "text-stone-500 hover:text-ink"
                )}
                aria-label="List view"
                title="List View"
              >
                <List className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Horizontally Scrollable Room Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 [scrollbar-width:none]">
            {ROOM_OPTIONS.map((r) => {
              const active = room === r;
              return (
                <button
                  key={r}
                  onClick={() => setRoom(r)}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-all duration-300 border",
                    active
                      ? "bg-black text-white border-black shadow-sm"
                      : "bg-white text-stone-600 border-stone-200 hover:border-gold hover:text-ink"
                  )}
                >
                  {active && <span className="h-1.5 w-1.5 rounded-full bg-gold" />}
                  {r}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Results Section */}
      <section className="bg-white pb-24">
        <div className="mx-auto max-w-[110rem] px-4 sm:px-6 lg:px-10">
          {/* Result Header */}
          <div className="mb-6 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Showing <span className="font-bold text-ink">{filtered.length}</span> curated pieces
            </p>
            {(activeCount > 0 || search || room !== "All Rooms") && (
              <button
                onClick={clearAll}
                className="flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-ink transition-colors"
              >
                <RotateCcw className="h-3 w-3 text-gold" />
                Reset Filters
              </button>
            )}
          </div>

          {/* Shimmer Skeleton or Results */}
          {isSearching || applyingFilters ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-5 md:gap-6">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-2xl border border-stone-200 bg-stone-100 p-4 space-y-4">
                  <div className="aspect-[4/5] w-full rounded-xl bg-stone-200" />
                  <div className="h-3 w-2/3 rounded bg-stone-200" />
                  <div className="h-4 w-5/6 rounded bg-stone-200" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-stone-300 bg-stone-50/50 py-24 text-center px-4">
              <p className="text-xl font-bold font-serif text-ink">No matching surfaces found</p>
              <p className="mt-2 text-xs text-stone-500 max-w-sm">
                Try broadening your filter criteria or search terms.
              </p>
              <button
                onClick={clearAll}
                className="mt-6 rounded-full bg-ink px-7 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-gold hover:text-ink transition-all shadow-md"
              >
                Reset Catalogue Filters
              </button>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-5 md:gap-6">
              {filtered.map((product) => (
                <ProductCard key={product.slug} product={product} />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((product) => (
                <div
                  key={product.slug}
                  className="flex flex-col md:flex-row items-center gap-6 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm hover:shadow-md hover:border-gold/40 transition-all"
                >
                  <div className="relative h-44 w-full md:w-60 shrink-0 overflow-hidden rounded-xl bg-stone-100">
                    <Image
                      src={product.lifestyleImage}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gold">
                      {product.brand} • {product.collection}
                    </span>
                    <h3 className="text-xl font-bold font-serif text-ink">{product.name}</h3>
                    <p className="text-xs text-stone-500 mt-1">{product.description}</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700 border border-stone-200">
                        Finish: {product.finish}
                      </span>
                      {product.thickness && (
                        <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700 border border-stone-200">
                          Thickness: {product.thickness}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 flex gap-2 w-full md:w-auto">
                    <Link
                      href={`/products/${product.category}/${product.slug}`}
                      className="flex-1 md:flex-initial rounded-full bg-ink px-6 py-3 text-xs font-bold text-white hover:bg-gold hover:text-ink transition-colors text-center"
                    >
                      View Collection →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Filter Side Drawer / Mobile Bottom Sheet */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-stone-200 p-6">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-gold" />
                  <h2 className="font-serif text-lg font-bold text-ink">Catalogue Filters</h2>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="rounded-full p-2 text-stone-400 hover:bg-stone-100 hover:text-ink transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Brand Filter */}
                <div className="space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-stone-400">Brand</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setBrand(null)}
                      className={cn(
                        "rounded-full px-3 py-1.5 text-xs font-medium border transition-colors",
                        brand === null ? "bg-black text-white border-black" : "bg-stone-50 border-stone-200 text-stone-700"
                      )}
                    >
                      All Brands
                    </button>
                    {brands.map((b) => (
                      <button
                        key={b}
                        onClick={() => setBrand(brand === b ? null : b)}
                        className={cn(
                          "rounded-full px-3 py-1.5 text-xs font-medium border transition-colors",
                          brand === b ? "bg-black text-white border-black" : "bg-stone-50 border-stone-200 text-stone-700 hover:border-gold"
                        )}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Finish Filter */}
                <div className="space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-stone-400">Surface Finish</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setFinish(null)}
                      className={cn(
                        "rounded-full px-3 py-1.5 text-xs font-medium border transition-colors",
                        finish === null ? "bg-black text-white border-black" : "bg-stone-50 border-stone-200 text-stone-700"
                      )}
                    >
                      All Finishes
                    </button>
                    {finishes.map((f) => (
                      <button
                        key={f}
                        onClick={() => setFinish(finish === f ? null : f)}
                        className={cn(
                          "rounded-full px-3 py-1.5 text-xs font-medium border transition-colors",
                          finish === f ? "bg-black text-white border-black" : "bg-stone-50 border-stone-200 text-stone-700 hover:border-gold"
                        )}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Availability Filter */}
                <div className="space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-stone-400">Availability</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setAvailability(null)}
                      className={cn(
                        "rounded-full px-3 py-1.5 text-xs font-medium border transition-colors",
                        availability === null ? "bg-black text-white border-black" : "bg-stone-50 border-stone-200 text-stone-700"
                      )}
                    >
                      All Stock
                    </button>
                    <button
                      onClick={() => setAvailability(availability === "In Stock" ? null : "In Stock")}
                      className={cn(
                        "rounded-full px-3 py-1.5 text-xs font-medium border transition-colors",
                        availability === "In Stock" ? "bg-black text-white border-black" : "bg-stone-50 border-stone-200 text-stone-700 hover:border-gold"
                      )}
                    >
                      In Stock Slabs
                    </button>
                    <button
                      onClick={() => setAvailability(availability === "Sample Available" ? null : "Sample Available")}
                      className={cn(
                        "rounded-full px-3 py-1.5 text-xs font-medium border transition-colors",
                        availability === "Sample Available" ? "bg-black text-white border-black" : "bg-stone-50 border-stone-200 text-stone-700 hover:border-gold"
                      )}
                    >
                      Sample Swatch Available
                    </button>
                  </div>
                </div>
              </div>

              {/* Drawer Footer Actions */}
              <div className="border-t border-stone-200 p-6 flex gap-3">
                <button
                  onClick={clearAll}
                  className="flex-1 rounded-full border border-stone-200 py-3 text-xs font-bold text-stone-700 hover:bg-stone-50 transition-colors"
                >
                  Clear All
                </button>
                <button
                  onClick={handleApplyFilters}
                  disabled={applyingFilters}
                  className="flex-1 rounded-full bg-gold py-3 text-xs font-bold text-ink hover:bg-accent-hover transition-colors shadow-md disabled:opacity-50"
                >
                  {applyingFilters ? "Applying…" : "Apply Filters"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

