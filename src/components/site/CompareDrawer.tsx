"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { X, ArrowRight, Layers, Trash2 } from "lucide-react";
import { useCompare } from "@/hooks/useCompare";
import { products } from "@/lib/catalog";

export function CompareDrawer() {
  const { items, remove, clear, count } = useCompare();

  if (count === 0) return null;

  const comparedProducts = items
    .map((slug) => products.find((p) => p.slug === slug))
    .filter(Boolean);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="fixed bottom-4 inset-x-4 md:inset-x-auto md:right-8 z-40 max-w-2xl bg-charcoal text-white rounded-2xl p-4 shadow-float border border-white/10"
      >
        <div className="flex items-center justify-between gap-4 mb-3 pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-accent" />
            <span className="text-sm font-semibold text-white">
              Product Comparison ({count}/4)
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={clear}
              className="text-xs text-stone-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" /> Clear All
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 overflow-x-auto py-1">
            {comparedProducts.map((product) => (
              <div
                key={product!.slug}
                className="relative flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-1.5 pr-3 shrink-0"
              >
                <div className="relative h-10 w-10 overflow-hidden rounded-lg bg-white/10">
                  <Image
                    src={product!.lifestyleImage}
                    alt={product!.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="max-w-[100px] text-xs truncate">
                  <p className="font-semibold text-white truncate">{product!.name}</p>
                  <p className="text-[10px] text-stone-400 truncate">{product!.brand}</p>
                </div>
                <button
                  onClick={() => remove(product!.slug)}
                  className="text-stone-400 hover:text-white transition-colors"
                  aria-label={`Remove ${product!.name} from comparison`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>

          <Link
            href="/compare"
            className="shrink-0 flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-ink hover:bg-accent-hover transition-colors shadow-yellow"
          >
            Compare Specs <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
