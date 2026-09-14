"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { X, ArrowUpRight } from "lucide-react";
import type { CatalogProduct } from "@/lib/catalog";
import { SafeImage } from "@/components/ui/SafeImage";
import { WishlistButton } from "@/components/site/catalog/WishlistButton";
import { Skeleton } from "@/components/ui/Skeleton";

/**
 * A fast look at one product without leaving the grid.
 *
 * Reuses the existing `/api/products/by-slug` route rather than a new
 * endpoint — it already returns the same fully-resolved `CatalogProduct`
 * shape (image, brand, code, finish/size/collection) that the PDP and every
 * card already render from.
 */
export function QuickViewModal({ slug, onClose }: { slug: string | null; onClose: () => void }) {
  const [product, setProduct] = useState<CatalogProduct | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!slug) {
      setProduct(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setProduct(null);
    fetch(`/api/products/by-slug?slugs=${encodeURIComponent(slug)}`)
      .then((r) => r.json())
      .then((data: { products?: CatalogProduct[] }) => {
        if (!cancelled) setProduct(data.products?.[0] ?? null);
      })
      .catch(() => {
        if (!cancelled) setProduct(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [slug, onClose]);

  const open = Boolean(slug);
  const href = product ? `/products/${product.category}/${product.slug}` : "#";

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-ink/70 backdrop-blur-xs"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            role="dialog"
            aria-modal="true"
            aria-label={product ? `${product.name} quick view` : "Quick view"}
            className="relative grid w-full max-w-2xl grid-cols-1 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl sm:grid-cols-2"
          >
            <button
              onClick={onClose}
              aria-label="Close quick view"
              className="absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/80 text-stone-500 backdrop-blur-sm transition-colors hover:text-ink"
            >
              <X className="h-4.5 w-4.5" />
            </button>

            <div className="relative aspect-square sm:aspect-auto">
              {loading || !product ? (
                <Skeleton className="h-full w-full rounded-none" />
              ) : (
                <SafeImage
                  src={product.lifestyleImage}
                  alt={product.name}
                  fill
                  sizes="(max-width: 640px) 100vw, 320px"
                  placeholderLabel={product.brand}
                  className="object-cover"
                />
              )}
            </div>

            <div className="flex flex-col p-6 sm:p-7">
              {loading || !product ? (
                <div className="space-y-3">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ) : (
                <>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold">
                    {product.brand}
                  </p>
                  <h2 className="mt-1.5 text-xl font-medium leading-snug tracking-tight text-text">
                    {product.name}
                  </h2>

                  <dl className="mt-4 space-y-1.5 text-sm">
                    {product.collection && (
                      <Row label="Collection" value={product.collection} />
                    )}
                    {product.sizes?.[0] && <Row label="Size" value={product.sizes[0]} />}
                    {product.finish && product.finish !== "Standard" && (
                      <Row label="Finish" value={product.finish} />
                    )}
                    {product.color && product.color !== "Natural" && (
                      <Row label="Colour" value={product.color} />
                    )}
                    {product.sku && <Row label="Code" value={product.sku} />}
                  </dl>

                  <div className="mt-auto flex flex-wrap items-center gap-3 pt-6">
                    <Link
                      href={href}
                      onClick={onClose}
                      className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-ink/85"
                    >
                      View Full Details
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                    <WishlistButton slug={product.slug} name={product.name} variant="full" />
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="w-24 shrink-0 text-ink/40">{label}</dt>
      <dd className="text-text">{value}</dd>
    </div>
  );
}
