"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Search, X, ArrowRight, Layers, LayoutGrid, Sparkles } from "lucide-react";
import { products, applicationList } from "@/lib/catalog";


interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const [query, setQuery] = useState("");
  const router = useRouter();
  const [, startTransition] = useTransition();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Open search modal (parent handler)
        }
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const trimmed = query.trim().toLowerCase();

  const matchingProducts = trimmed
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(trimmed) ||
          p.collection.toLowerCase().includes(trimmed) ||
          p.brand.toLowerCase().includes(trimmed) ||
          p.color.toLowerCase().includes(trimmed) ||
          p.finish.toLowerCase().includes(trimmed)
      )
    : products.slice(0, 4); // Suggestions when empty

  const matchingApplications = trimmed
    ? applicationList.filter((app) => app.toLowerCase().includes(trimmed))
    : applicationList.slice(0, 5);

  const collections = Array.from(new Set(products.map((p) => p.collection)));
  const matchingCollections = trimmed
    ? collections.filter((c) => c.toLowerCase().includes(trimmed))
    : collections.slice(0, 4);

  const handleSelectProduct = (href: string) => {
    onClose();
    startTransition(() => {
      router.push(href);
    });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-start justify-center pt-16 md:pt-24 px-4 sm:px-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-ink/70 backdrop-blur-md"
        />

        {/* Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -20 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl border border-stone-200"
        >
          {/* Search Header */}
          <div className="relative flex items-center border-b border-stone-200 px-6 py-4">
            <Search className="h-5 w-5 text-accent shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tiles, marble, sanitaryware, applications, brands..."
              autoFocus
              className="w-full bg-transparent px-4 text-lg font-medium text-ink placeholder:text-stone-400 focus:outline-none"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="mr-2 text-stone-400 hover:text-ink transition-colors"
                aria-label="Clear query"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-lg bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-500 hover:bg-stone-200 transition-colors"
            >
              ESC
            </button>
          </div>

          {/* Results Area */}
          <div className="max-h-[65vh] overflow-y-auto p-6 space-y-6">
            {/* Products */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-warm mb-3">
                <span className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-accent" />
                  {trimmed ? "Matching Products" : "Featured Suggestions"}
                </span>
                <span className="text-stone-400">{matchingProducts.length} items</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {matchingProducts.map((product) => (
                  <button
                    key={product.slug}
                    onClick={() => handleSelectProduct(`/products/${product.category}/${product.slug}`)}
                    className="group flex items-center gap-4 rounded-xl border border-stone-200 p-3 text-left transition-all hover:border-accent hover:bg-offwhite hover:shadow-soft"
                  >
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-stone-100">
                      <Image
                        src={product.lifestyleImage}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-accent uppercase tracking-wider">
                        {product.brand}
                      </p>
                      <h4 className="text-sm font-semibold text-ink truncate group-hover:text-ink">
                        {product.name}
                      </h4>
                      <p className="text-xs text-slate-warm truncate">{product.collection}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-stone-300 transition-transform group-hover:translate-x-1 group-hover:text-accent shrink-0" />
                  </button>
                ))}
              </div>
            </div>

            {/* Applications & Room Types */}
            {matchingApplications.length > 0 && (
              <div className="pt-2 border-t border-stone-100">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-warm mb-3 flex items-center gap-2">
                  <LayoutGrid className="h-4 w-4 text-accent" />
                  Applications & Room Types
                </div>
                <div className="flex flex-wrap gap-2">
                  {matchingApplications.map((app) => (
                    <button
                      key={app}
                      onClick={() =>
                        handleSelectProduct(
                          `/applications/${app.toLowerCase().replace(/\s+/g, "-")}`
                        )
                      }
                      className="rounded-full border border-stone-200 bg-offwhite px-4 py-2 text-xs font-semibold text-ink transition-all hover:border-accent hover:bg-accent hover:text-ink"
                    >
                      {app}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Collections */}
            {matchingCollections.length > 0 && (
              <div className="pt-2 border-t border-stone-100">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-warm mb-3 flex items-center gap-2">
                  <Layers className="h-4 w-4 text-accent" />
                  Collections
                </div>
                <div className="space-y-2">
                  {matchingCollections.map((col) => (
                    <button
                      key={col}
                      onClick={() =>
                        handleSelectProduct(`/products?collection=${encodeURIComponent(col)}`)
                      }
                      className="w-full flex items-center justify-between rounded-lg p-2.5 text-left text-sm font-medium text-ink hover:bg-offwhite transition-colors"
                    >
                      <span>{col}</span>
                      <span className="text-xs font-semibold text-accent flex items-center gap-1">
                        Explore Collection <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer keyboard tip */}
          <div className="border-t border-stone-200 bg-offwhite px-6 py-3 text-center text-xs text-slate-warm flex items-center justify-between">
            <span>Press <kbd className="rounded bg-white px-1.5 py-0.5 font-bold shadow-xs">ESC</kbd> to exit</span>
            <span className="font-semibold text-accent">Prestige Global Search</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
