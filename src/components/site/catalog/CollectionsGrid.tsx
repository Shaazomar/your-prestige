"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowRight, Search, RotateCcw } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SafeImage } from "@/components/ui/SafeImage";
import { cn } from "@/lib/utils";
import type { CollectionView } from "@/lib/collections";

/**
 * The `/collections` grid.
 *
 * Client-side only for the search box and the brand pills; the collections
 * themselves come from the database via the server component that renders
 * this. Every card links to that collection's own page.
 *
 * Nothing here invents a figure. The badge shows the real published product
 * count, and a collection with no description simply renders without one
 * rather than with filler copy about a material we have not verified.
 */
export function CollectionsGrid({ collections }: { collections: CollectionView[] }) {
  const [search, setSearch] = useState("");
  const [activeBrand, setActiveBrand] = useState("All");

  const brands = useMemo(() => {
    const names = [...new Set(collections.map((c) => c.brandName).filter((b): b is string => !!b))];
    return ["All", ...names.sort()];
  }, [collections]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return collections.filter((c) => {
      if (activeBrand !== "All" && c.brandName !== activeBrand) return false;
      if (q && !`${c.name} ${c.brandName ?? ""} ${c.description ?? ""}`.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [collections, search, activeBrand]);

  return (
    <>
      <div className="relative z-20 mx-auto max-w-[110rem] px-4 sm:px-6 lg:px-10 -mt-2 mb-12">
        <div className="rounded-3xl border border-stone-200/80 bg-white p-4 sm:p-5 shadow-[0_8px_30px_rgba(0,0,0,0.06)] space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search collections…"
                aria-label="Search collections"
                className="w-full rounded-full border border-stone-200 bg-stone-50/70 py-2.5 pl-11 pr-4 text-xs font-medium outline-none transition-all focus:border-gold focus:bg-white"
              />
            </div>
            {(search || activeBrand !== "All") && (
              <button
                onClick={() => {
                  setSearch("");
                  setActiveBrand("All");
                }}
                className="flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-ink transition-colors"
              >
                <RotateCcw className="h-3 w-3 text-gold" />
                Reset
              </button>
            )}
          </div>

          {brands.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
              {brands.map((b) => {
                const active = activeBrand === b;
                return (
                  <button
                    key={b}
                    onClick={() => setActiveBrand(b)}
                    className={cn(
                      "flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-all duration-300 border",
                      active
                        ? "bg-black text-white border-black shadow-sm"
                        : "bg-white text-stone-600 border-stone-200 hover:border-gold hover:text-ink"
                    )}
                  >
                    {active && <span className="h-1.5 w-1.5 rounded-full bg-gold" />}
                    {b}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <section className="bg-white pb-28">
        <Container size="wide">
          {filtered.length === 0 ? (
            <p className="py-16 text-center text-sm text-stone-500">
              No collections match that search.
            </p>
          ) : (
            <div className="space-y-16">
              {filtered.map((col, index) => (
                <div
                  key={col.slug}
                  className="group grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center rounded-3xl border border-stone-200/70 bg-white p-6 sm:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.03)] transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] hover:border-gold/30"
                >
                  <div
                    className={cn(
                      "relative h-[360px] sm:h-[440px] w-full overflow-hidden rounded-2xl lg:col-span-7 bg-stone-100",
                      index % 2 === 1 ? "lg:order-2" : ""
                    )}
                  >
                    <SafeImage
                      src={col.image ?? ""}
                      alt={`${col.brandName ? `${col.brandName} ` : ""}${col.name} collection`}
                      fill
                      sizes="(max-width: 1024px) 100vw, 55vw"
                      placeholderLabel={col.name}
                      className="object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
                    />
                    <div className="absolute top-4 left-4 flex flex-wrap gap-2 z-10">
                      <span className="rounded-full bg-black/70 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-accent backdrop-blur-md border border-white/10 shadow-xs">
                        {col.count.toLocaleString("en-IN")} product{col.count === 1 ? "" : "s"}
                      </span>
                    </div>
                  </div>

                  <div className={cn("lg:col-span-5 space-y-5", index % 2 === 1 ? "lg:order-1" : "")}>
                    {col.brandName && (
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gold">
                        {col.brandName}
                      </span>
                    )}
                    <h2 className="font-serif text-3xl sm:text-4xl font-bold text-ink leading-tight">
                      {col.name}
                    </h2>
                    {col.description && (
                      <p className="text-sm text-stone-500 leading-relaxed">{col.description}</p>
                    )}
                    <div className="pt-2">
                      <Link
                        href={`/collections/${col.slug}`}
                        className="inline-flex items-center gap-2 rounded-full bg-ink px-7 py-3.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-gold hover:text-ink transition-all duration-300 shadow-md group/btn"
                      >
                        <span>Explore Collection</span>
                        <ArrowRight className="h-4 w-4 text-gold group-hover/btn:text-ink transition-transform duration-300 group-hover/btn:translate-x-1" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Container>
      </section>
    </>
  );
}
