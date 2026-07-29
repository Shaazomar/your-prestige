"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { useLocalCollection, RECENTLY_VIEWED_KEY } from "@/hooks/useLocalCollection";
import type { CatalogProduct } from "@/lib/catalog";

/**
 * Records the current product as viewed, and shows the visitor's recent trail.
 *
 * The list is slugs in localStorage; the product data it needs is fetched from
 * a small public endpoint rather than embedded in every page, since which
 * products a given visitor has seen is only knowable in their browser.
 */
export function RecentlyViewed({
  currentSlug,
  currentName,
}: {
  currentSlug?: string;
  currentName?: string;
}) {
  const recent = useLocalCollection(RECENTLY_VIEWED_KEY, 12);
  const [products, setProducts] = useState<CatalogProduct[]>([]);

  // Record the visit. `add` is stable and dedupes, so this is safe on re-render.
  useEffect(() => {
    if (currentSlug) recent.add(currentSlug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSlug]);

  const slugs = recent.items.filter((s) => s !== currentSlug).slice(0, 6);
  const key = slugs.join(",");

  useEffect(() => {
    if (!key) {
      setProducts([]);
      return;
    }
    let cancelled = false;
    fetch(`/api/products/by-slug?slugs=${encodeURIComponent(key)}`)
      .then((r) => (r.ok ? r.json() : { products: [] }))
      .then((d) => {
        if (!cancelled) setProducts(d.products ?? []);
      })
      .catch(() => {
        // A failed lookup just means no trail this time — never a visible error.
      });
    return () => {
      cancelled = true;
    };
  }, [key]);

  if (!recent.ready || products.length === 0) return null;

  return (
    <section className="border-t hairline bg-porcelain py-16 md:py-20">
      <Container>
        <p className="text-eyebrow mb-6 text-ink/40">
          {currentName ? "You were also looking at" : "Recently viewed"}
        </p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {products.map((p) => (
            <Link
              key={p.slug}
              href={`/products/${p.category}/${p.slug}`}
              className="group block"
            >
              <div className="relative aspect-square overflow-hidden rounded-xl bg-ink/5">
                <Image
                  src={p.lifestyleImage}
                  alt={p.name}
                  fill
                  sizes="(max-width: 640px) 45vw, 16vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <p className="mt-2 truncate text-xs font-medium">{p.name}</p>
              <p className="truncate text-[0.7rem] text-ink/40">{p.brand}</p>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
