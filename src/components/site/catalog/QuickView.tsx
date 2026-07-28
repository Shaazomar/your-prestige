"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  X, ChevronLeft, ChevronRight, ArrowUpRight, Download, Share2,
  Heart, MessageCircle,
} from "lucide-react";
import type { CatalogProduct } from "@/lib/catalog";
import { SizeChip } from "@/components/site/catalog/SizeChip";
import { ApplicationBadge } from "@/components/site/catalog/ApplicationBadge";
import { BrandMark } from "@/components/site/catalog/BrandMark";
import { ButtonLink } from "@/components/ui/Button";
import { business } from "@/lib/site-config";
import { cn } from "@/lib/utils";

interface QuickViewProps {
  product: CatalogProduct | null;
  onClose: () => void;
}

/** Fullscreen luxury quick-view — image slider, specs, and a clear path to the showroom. */
export function QuickView({ product, onClose }: QuickViewProps) {
  const [slide, setSlide] = useState(0);
  const [saved, setSaved] = useState(false);

  const images = product
    ? [product.lifestyleImage, product.textureImage, ...product.gallery]
    : [];

  useEffect(() => {
    setSlide(0);
    setSaved(false);
  }, [product]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setSlide((s) => (s + 1) % images.length);
      if (e.key === "ArrowLeft") setSlide((s) => (s - 1 + images.length) % images.length);
    }
    if (product) {
      window.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [product, images.length, onClose]);

  return (
    <AnimatePresence>
      {product && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/80 backdrop-blur-md p-3 md:p-8"
          role="dialog"
          aria-modal
          aria-label={`Quick view — ${product.name}`}
        >
          {/* Backdrop click to close */}
          <button
            aria-label="Close quick view"
            onClick={onClose}
            className="absolute inset-0 cursor-default"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 12 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-[28px] bg-ivory shadow-float md:flex-row"
          >
            <button
              onClick={onClose}
              aria-label="Close"
              className="glass absolute right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full text-ink shadow-soft transition-transform hover:scale-105"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Image slider */}
            <div className="relative aspect-[4/3] shrink-0 bg-charcoal md:aspect-auto md:w-3/5">
              <AnimatePresence mode="wait">
                <motion.div
                  key={slide}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-0"
                >
                  <Image
                    src={images[slide]}
                    alt={`${product.name} — view ${slide + 1}`}
                    fill
                    sizes="(max-width: 768px) 100vw, 60vw"
                    className="object-cover"
                    priority
                  />
                </motion.div>
              </AnimatePresence>

              <button
                onClick={() => setSlide((s) => (s - 1 + images.length) % images.length)}
                aria-label="Previous image"
                className="glass absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-ink shadow-soft transition-transform hover:scale-105"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => setSlide((s) => (s + 1) % images.length)}
                aria-label="Next image"
                className="glass absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-ink shadow-soft transition-transform hover:scale-105"
              >
                <ChevronRight className="h-5 w-5" />
              </button>

              <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setSlide(i)}
                    aria-label={`Go to image ${i + 1}`}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-500",
                      i === slide ? "w-6 bg-ivory" : "w-1.5 bg-ivory/40 hover:bg-ivory/70"
                    )}
                  />
                ))}
              </div>
            </div>

            {/* Details */}
            <div className="flex flex-1 flex-col overflow-y-auto p-7 md:p-10">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-eyebrow text-gold">{product.collection}</p>
                  <h2 className="mt-2 text-3xl font-semibold tracking-tight text-ink">
                    {product.name}
                  </h2>
                </div>
                <BrandMark brand={product.brand} />
              </div>

              <p className="mt-5 leading-relaxed text-slate-warm">{product.description}</p>

              <div className="mt-7 grid grid-cols-2 gap-x-6 gap-y-4 border-y hairline py-6 text-sm">
                <div>
                  <p className="text-stone-400">Finish</p>
                  <p className="mt-0.5 font-medium text-ink">{product.finish}</p>
                </div>
                <div>
                  <p className="text-stone-400">Thickness</p>
                  <p className="mt-0.5 font-medium text-ink">{product.thickness}</p>
                </div>
                <div>
                  <p className="text-stone-400">Color</p>
                  <p className="mt-0.5 font-medium text-ink">{product.color}</p>
                </div>
                <div>
                  <p className="text-stone-400">Texture</p>
                  <p className="mt-0.5 font-medium text-ink">{product.texture}</p>
                </div>
              </div>

              <div className="mt-6">
                <p className="mb-3 text-eyebrow text-stone-400">Available Sizes</p>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size, i) => (
                    <SizeChip key={size} size={size} index={i} />
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <p className="mb-3 text-eyebrow text-stone-400">Applications</p>
                <div className="flex flex-wrap gap-2">
                  {product.applications.map((app) => (
                    <ApplicationBadge key={app} application={app} />
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="mt-8 flex flex-wrap items-center gap-3 border-t hairline pt-6">
                <ButtonLink href="/request-quote" variant="gold" size="md">
                  Request a Quote
                  <ArrowUpRight className="h-4 w-4" />
                </ButtonLink>
                <ButtonLink href="/book-visit" variant="outline" size="md">
                  Visit Showroom
                </ButtonLink>
                <a
                  href={`https://wa.me/${business.whatsapp}?text=${encodeURIComponent(
                    `Hi! I'm interested in ${product.name} (${product.collection}).`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-ink/12 text-ink transition-colors hover:border-[#25D366] hover:text-[#25D366]"
                  aria-label="Ask on WhatsApp"
                >
                  <MessageCircle className="h-4.5 w-4.5" />
                </a>
                <button
                  onClick={() => setSaved((s) => !s)}
                  aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-full border transition-colors",
                    saved
                      ? "border-gold bg-gold/10 text-gold"
                      : "border-ink/12 text-ink hover:border-gold hover:text-gold"
                  )}
                >
                  <Heart className={cn("h-4.5 w-4.5", saved && "fill-gold")} />
                </button>
                <button
                  aria-label="Share this product"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-ink/12 text-ink transition-colors hover:border-ink"
                >
                  <Share2 className="h-4.5 w-4.5" />
                </button>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-5 text-sm">
                <Link
                  href={`/products/${product.category}/${product.slug}`}
                  className="link-gold font-medium text-ink"
                >
                  View Full Details
                </Link>
                <button className="flex items-center gap-1.5 text-slate-warm transition-colors hover:text-gold">
                  <Download className="h-4 w-4" />
                  Download Catalogue
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
