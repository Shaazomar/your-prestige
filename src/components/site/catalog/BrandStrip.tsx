"use client";

import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BrandStripItem {
  slug: string;
  name: string;
  count: number;
}

/**
 * Horizontal brand-first discovery strip for `/products`. Reads/writes the
 * same `?brand=` query param `CatalogBrowser`'s own facet chips use, so
 * picking a brand here composes with whatever else is already filtered.
 */
export function BrandStrip({ brands }: { brands: BrandStripItem[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = searchParams.get("brand");

  function select(name: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    if (name) params.set("brand", name);
    else params.delete("brand");
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <button
        type="button"
        onClick={() => select(null)}
        className={cn(
          "shrink-0 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-colors duration-300",
          !active ? "border-ink bg-ink text-ivory" : "border-ink/10 text-muted hover:border-gold/50"
        )}
      >
        All
      </button>
      {brands.map((b) => (
        <button
          key={b.slug}
          type="button"
          onClick={() => select(b.name)}
          className={cn(
            "shrink-0 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-colors duration-300",
            active === b.name ? "border-ink bg-ink text-ivory" : "border-ink/10 text-muted hover:border-gold/50"
          )}
        >
          {b.name}
          <span className={cn("ml-1.5 font-normal normal-case", active === b.name ? "text-ivory/60" : "text-ink/35")}>
            {b.count}
          </span>
        </button>
      ))}
      <Link
        href="/brands"
        className="inline-flex shrink-0 items-center gap-1 rounded-full border border-dashed border-ink/15 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted transition-colors duration-300 hover:border-gold/50 hover:text-gold"
      >
        View All Brands
        <ArrowUpRight className="h-3 w-3" />
      </Link>
    </div>
  );
}
