"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Layers, ArrowRight } from "lucide-react";
import type { CatalogProduct } from "@/lib/catalog";
import { WishlistButton } from "@/components/site/catalog/WishlistButton";
import { useCompare } from "@/hooks/useCompare";
import { cn } from "@/lib/utils";
import { SafeImage } from "@/components/ui/SafeImage";

interface ProductCardProps {
  product: CatalogProduct;
  className?: string;
  whatsappNumber?: string;
}

export function ProductCard({ product, className, whatsappNumber = "919008919195" }: ProductCardProps) {
  const [hovered, setHovered] = useState(false);
  const { has: isComparing, toggle: toggleCompare } = useCompare();

  const href = `/products/${product.category}/${product.slug}`;
  const compared = isComparing(product.slug);

  // Clean whatsapp number (digits only)
  const cleanWa = whatsappNumber.replace(/\D/g, "") || "919008919195";

  // Normalize tag display
  const badgeText = product.tag ? product.tag.toUpperCase() : null;

  return (
    <div
      className={cn("group relative flex flex-col h-full", className)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex flex-col flex-1 overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)] hover:border-gold/40">
        {/* Image Showcase Stage */}
        <div className="relative block w-full overflow-hidden aspect-[4/5] bg-stone-100">
          <Link
            href={href}
            aria-label={`View details of ${product.name}`}
            className="absolute inset-0 w-full h-full"
          >
            <motion.div
              animate={{ scale: hovered ? 1.03 : 1 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0"
            >
              <SafeImage
                src={product.lifestyleImage}
                alt={product.name}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className="object-cover object-center"
                lightSkeleton
              />
            </motion.div>

            {/* Gradient overlay on hover */}
            <div className="absolute inset-0 bg-black/0 transition-colors duration-500 group-hover:bg-black/15" />
          </Link>

          {/* Top Badges & Floating Actions */}
          <div className="absolute inset-x-3.5 top-3.5 flex items-start justify-between pointer-events-auto z-10">
            {badgeText ? (
              <span className="rounded-full bg-accent px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-ink shadow-xs backdrop-blur-md">
                {badgeText}
              </span>
            ) : (
              <span />
            )}

            <div className="flex items-center gap-1.5">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleCompare(product.slug);
                }}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300 shadow-xs",
                  compared
                    ? "bg-accent text-ink"
                    : "bg-black/50 text-white hover:bg-black/80 backdrop-blur-md hover:scale-105"
                )}
                aria-label="Toggle compare"
                title={compared ? "Comparing" : "Compare"}
              >
                <Layers className="h-3.5 w-3.5" />
              </button>

              <WishlistButton slug={product.slug} name={product.name} />
            </div>
          </div>

          {/* Swatch Overlap Preview */}
          {product.textureImage && (
            <div className="absolute bottom-3 left-3 h-9 w-9 overflow-hidden rounded-full border-2 border-white shadow-md transition-transform duration-500 group-hover:scale-110 z-10">
              <SafeImage
                src={product.textureImage}
                alt={`${product.name} surface texture`}
                fill
                sizes="36px"
                className="object-cover"
                lightSkeleton
              />
            </div>
          )}
        </div>

        {/* Product Information Body */}
        <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[9px] font-bold uppercase tracking-widest text-gold">
                {product.brand}
              </span>
              {product.thickness && (
                <span className="shrink-0 rounded-full bg-stone-100 px-2 py-0.5 text-[9px] font-semibold text-stone-600 border border-stone-200/60">
                  {product.thickness}
                </span>
              )}
            </div>

            <Link href={href} className="block">
              <h3 className="text-sm font-bold text-ink leading-snug group-hover:text-ink transition-colors line-clamp-1">
                {product.name}
              </h3>
            </Link>

            <p className="text-[11px] text-stone-500 font-medium">{product.collection}</p>
          </div>

          {/* WhatsApp & View Collection CTA */}
          <div className="pt-2.5 border-t border-stone-100 flex items-center justify-between gap-2">
            <Link
              href={href}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-700 transition-colors duration-300 group-hover:text-ink"
            >
              <span>View Collection</span>
              <ArrowRight className="h-3.5 w-3.5 text-gold transition-transform duration-300 group-hover:translate-x-1" />
            </Link>

            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const text = `Hello Prestige Tiles,\n\nI am interested in ordering:\n*Product*: ${product.name}\n*Brand*: ${product.brand}\n*Finish*: ${product.finish}\n*Product Link*: ${window.location.origin}${href}\n\nPlease share pricing and availability details.`;
                window.open(`https://wa.me/${cleanWa}?text=${encodeURIComponent(text)}`, "_blank");
                fetch("/api/analytics/whatsapp", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ eventType: "PRODUCT_CLICK", productName: product.name, collectionName: product.collection }),
                }).catch(() => {});
              }}
              className="flex items-center gap-1 rounded-full bg-[#25D366]/10 px-2.5 py-1 text-[10px] font-bold text-[#1eb956] hover:bg-[#25D366] hover:text-white transition-all"
              title="Enquire on WhatsApp"
            >
              Enquire
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

