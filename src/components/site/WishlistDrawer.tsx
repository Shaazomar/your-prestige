"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { X, Heart, Trash2, ShoppingBag } from "lucide-react";
import { useLocalCollection, WISHLIST_KEY } from "@/hooks/useLocalCollection";
import { products } from "@/lib/catalog";


interface WishlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenQuote: () => void;
}

export function WishlistDrawer({ isOpen, onClose, onOpenQuote }: WishlistDrawerProps) {
  const { items, remove, clear } = useLocalCollection(WISHLIST_KEY, 24);

  if (!isOpen) return null;

  const wishlistProducts = items
    .map((slug) => products.find((p) => p.slug === slug))
    .filter(Boolean);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex justify-end">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-ink/60 backdrop-blur-xs"
        />

        {/* Drawer panel */}
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="relative flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-stone-200 px-6 py-5">
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-accent fill-accent" />
              <h3 className="text-lg font-bold text-ink">Saved Favourites ({items.length})</h3>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-stone-400 hover:bg-offwhite hover:text-ink transition-colors"
              aria-label="Close wishlist drawer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {wishlistProducts.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center py-16">
                <div className="mb-4 rounded-full bg-offwhite p-5 text-stone-300">
                  <Heart className="h-10 w-10 text-stone-300" />
                </div>
                <h4 className="text-lg font-bold text-ink mb-1">Your wishlist is empty</h4>
                <p className="text-sm text-slate-warm mb-6 max-w-xs">
                  Save your favourite tile slabs and sanitaryware to compare or request sample quotes.
                </p>
                <Link
                  href="/products"
                  onClick={onClose}
                  className="rounded-xl bg-ink px-6 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-accent hover:text-ink transition-colors"
                >
                  Explore Catalog
                </Link>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between text-xs text-slate-warm mb-2">
                  <span>{wishlistProducts.length} Items saved</span>
                  <button
                    onClick={clear}
                    className="text-stone-400 hover:text-red-600 transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="h-3 w-3" /> Clear Wishlist
                  </button>
                </div>
                {wishlistProducts.map((product) => (
                  <div
                    key={product!.slug}
                    className="flex items-center gap-4 rounded-xl border border-stone-200 p-3 hover:border-accent transition-colors"
                  >
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-stone-100">
                      <Image
                        src={product!.lifestyleImage}
                        alt={product!.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-accent">
                        {product!.brand}
                      </p>
                      <h4 className="text-sm font-bold text-ink truncate">{product!.name}</h4>
                      <p className="text-xs text-slate-warm truncate">{product!.finish}</p>
                    </div>
                    <button
                      onClick={() => remove(product!.slug)}
                      className="p-1.5 text-stone-400 hover:text-red-600 transition-colors"
                      aria-label={`Remove ${product!.name}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Footer CTA */}
          {wishlistProducts.length > 0 && (
            <div className="border-t border-stone-200 bg-offwhite p-6 space-y-3">
              <button
                onClick={() => {
                  onClose();
                  onOpenQuote();
                }}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3.5 text-sm font-bold uppercase tracking-wider text-ink hover:bg-accent-hover transition-colors shadow-yellow"
              >
                <ShoppingBag className="h-4 w-4" /> Request Quote for All ({wishlistProducts.length})
              </button>
              <Link
                href="/products"
                onClick={onClose}
                className="w-full block text-center text-xs font-semibold text-slate-warm hover:text-ink transition-colors"
              >
                Continue Browsing
              </Link>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
