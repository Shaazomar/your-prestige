"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { RevealStagger, RevealItem } from "@/components/motion/Reveal";
import { BrandCard } from "./BrandCard";
import type { BrandView } from "@/lib/brands";

/**
 * Client-side search over the brand list — appropriate at this scale (a few
 * dozen brand rows, all already fetched for the grid below) unlike the main
 * product catalogue, which is server-searched because it runs to thousands.
 */
export function BrandsExplorer({
  brands,
  categoryNamesBySlug,
}: {
  brands: BrandView[];
  /** Each brand's real category names, so "sanitaryware" also finds Jaquar. */
  categoryNamesBySlug: Record<string, string[]>;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return brands;
    return brands.filter((b) => {
      if (b.name.toLowerCase().includes(q)) return true;
      if (b.shortDescription?.toLowerCase().includes(q)) return true;
      const categories = categoryNamesBySlug[b.slug] ?? [];
      return categories.some((c) => c.toLowerCase().includes(q));
    });
  }, [brands, query, categoryNamesBySlug]);

  return (
    <div>
      <div className="relative mx-auto mb-12 max-w-md">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/35" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search brands or collections…"
          className="w-full rounded-full border border-ink/10 bg-white py-3 pl-11 pr-10 text-sm outline-none transition-colors focus:border-gold"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-ink/35 hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="py-16 text-center text-ink/45">No brands or collections match “{query}”.</p>
      ) : (
        <RevealStagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" stagger={0.05}>
          {filtered.map((brand) => (
            <RevealItem key={brand.slug}>
              <BrandCard brand={brand} />
            </RevealItem>
          ))}
        </RevealStagger>
      )}
    </div>
  );
}
