"use client";

import { useRef, useState, type MouseEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Layers } from "lucide-react";
import type { CatalogProduct } from "@/lib/catalog";
import { SizeChip } from "@/components/site/catalog/SizeChip";
import { WishlistButton } from "@/components/site/catalog/WishlistButton";
import { useCompare } from "@/hooks/useCompare";
import { cn } from "@/lib/utils";
import { SafeImage } from "@/components/ui/SafeImage";

interface ProductCardProps {
  product: CatalogProduct;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const { has: isComparing, toggle: toggleCompare } = useCompare();

  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const rotateX = useSpring(useTransform(my, [0, 1], [4, -4]), { damping: 20, stiffness: 200 });
  const rotateY = useSpring(useTransform(mx, [0, 1], [-4, 4]), { damping: 20, stiffness: 200 });

  function onMouseMove(e: MouseEvent<HTMLDivElement>) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    mx.set((e.clientX - rect.left) / rect.width);
    my.set((e.clientY - rect.top) / rect.height);
  }

  function onMouseLeave() {
    mx.set(0.5);
    my.set(0.5);
    setHovered(false);
  }

  const href = `/products/${product.category}/${product.slug}`;
  const compared = isComparing(product.slug);

  return (
    <motion.div
      ref={ref}
      style={{ perspective: 1400 }}
      className={cn("group relative", className)}
      onMouseMove={onMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={onMouseLeave}
    >
      <motion.div
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-soft transition-all duration-500 group-hover:shadow-float group-hover:border-accent"
      >
        {/* Image stage */}
        <div className={cn("relative block w-full overflow-hidden text-left aspect-[4/5]")}>
          <Link
            href={href}
            aria-label={`View details of ${product.name}`}
            className="absolute inset-0 w-full h-full text-left"
          >
            <motion.div
              animate={{ scale: hovered ? 1.07 : 1 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0"
            >
              <SafeImage
                src={product.lifestyleImage}
                alt={product.name}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover"
                lightSkeleton
              />
            </motion.div>

            <div className="absolute inset-0 bg-ink/0 transition-colors duration-500 group-hover:bg-ink/30" />
          </Link>

          {/* Top chips */}
          <div className="absolute inset-x-4 top-4 flex items-start justify-between pointer-events-auto z-10">
            {product.tag ? (
              <span className="rounded-full bg-accent px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-ink shadow-xs">
                {product.tag}
              </span>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleCompare(product.slug);
                }}
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-full transition-all shadow-xs",
                  compared
                    ? "bg-accent text-ink"
                    : "bg-black/60 text-white hover:bg-black/80 backdrop-blur-md"
                )}
                aria-label="Toggle compare"
                title={compared ? "Comparing" : "Compare"}
              >
                <Layers className="h-4 w-4" />
              </button>

              <WishlistButton slug={product.slug} name={product.name} />
            </div>
          </div>

          {/* Texture swatch overlap */}
          <div className="absolute bottom-3 left-3 h-11 w-11 overflow-hidden rounded-full border-2 border-white shadow-float transition-transform duration-500 group-hover:scale-110 z-10">
            <SafeImage
              src={product.textureImage}
              alt={`${product.name} texture`}
              fill
              sizes="44px"
              className="object-cover"
              lightSkeleton
            />
          </div>
        </div>

        {/* Card Body */}
        <div className="p-3.5 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-accent">
                {product.brand} • {product.collection}
              </p>
              <Link href={href} className="link-yellow">
                <h3 className="mt-0.5 text-sm font-bold tracking-tight text-ink group-hover:text-ink leading-tight">
                  {product.name}
                </h3>
              </Link>
            </div>
            <span className="shrink-0 rounded-full bg-offwhite px-2 py-0.5 text-[9px] font-bold text-stone-500 border border-stone-200">
              {product.thickness}
            </span>
          </div>

          <p className="text-[11px] text-slate-warm">{product.finish}</p>

          <div className="flex flex-wrap gap-1 pt-1.5">
            {product.sizes.slice(0, 2).map((size, i) => (
              <SizeChip key={size} size={size} index={i} />
            ))}
            {product.sizes.length > 2 && (
              <span className="inline-flex items-center rounded-full border border-dashed border-stone-300 px-2 py-0.5 text-[9px] text-stone-500">
                +{product.sizes.length - 2} formats
              </span>
            )}
          </div>

          {/* WhatsApp & Enquiry List Actions */}
          <div className="pt-2 border-t border-stone-100 flex items-center gap-1.5">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const text = `Hello Prestige Tiles,\n\nI am interested in ordering:\n*Product*: ${product.name}\n*Brand*: ${product.brand}\n*Finish*: ${product.finish}\n*Size*: ${product.sizes[0] || "Standard"}\n*Product Link*: ${window.location.origin}${href}\n\nPlease share pricing and availability details.`;
                window.open(`https://wa.me/919876543210?text=${encodeURIComponent(text)}`, "_blank");
                fetch("/api/analytics/whatsapp", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ eventType: "PRODUCT_CLICK", productName: product.name, collectionName: product.collection }),
                }).catch(() => {});
              }}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-[#25D366] px-2.5 py-1.5 text-[11px] font-bold text-white shadow-xs transition-transform hover:scale-[1.02]"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5" aria-hidden>
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Enquire
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

