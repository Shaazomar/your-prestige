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


const aspectClass: Record<CatalogProduct["aspect"], string> = {
  portrait: "aspect-[4/5]",
  square: "aspect-[1/1]",
  landscape: "aspect-[5/4]",
};

interface ProductCardProps {
  product: CatalogProduct;
  onQuickView?: (product: CatalogProduct) => void;
  className?: string;
}

export function ProductCard({ product, onQuickView, className }: ProductCardProps) {
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
        <div className={cn("relative block w-full overflow-hidden text-left", aspectClass[product.aspect])}>
          <button
            type="button"
            onClick={() => onQuickView?.(product)}
            aria-label={`Quick view ${product.name}`}
            className="absolute inset-0 w-full h-full text-left"
          >
            <motion.div
              animate={{ scale: hovered ? 1.07 : 1 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0"
            >
              <Image
                src={product.lifestyleImage}
                alt={product.name}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover"
              />
            </motion.div>

            <div className="absolute inset-0 bg-ink/0 transition-colors duration-500 group-hover:bg-ink/30" />
          </button>

          {/* Top chips */}
          <div className="absolute inset-x-4 top-4 flex items-start justify-between pointer-events-auto z-10">
            {product.tag ? (
              <span className="rounded-full bg-accent px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-ink shadow-xs">
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
                  "flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-bold transition-all shadow-xs",
                  compared
                    ? "bg-accent text-ink"
                    : "bg-black/60 text-white hover:bg-black/80 backdrop-blur-md"
                )}
                aria-label="Toggle compare"
              >
                <Layers className="h-3.5 w-3.5" />
                <span>{compared ? "Comparing" : "Compare"}</span>
              </button>

              <WishlistButton slug={product.slug} name={product.name} />
            </div>
          </div>

          {/* Texture swatch overlap */}
          <div className="absolute bottom-4 left-4 h-12 w-12 overflow-hidden rounded-full border-2 border-white shadow-float transition-transform duration-500 group-hover:scale-110 z-10">
            <Image
              src={product.textureImage}
              alt={`${product.name} texture`}
              fill
              sizes="48px"
              className="object-cover"
            />
          </div>
        </div>

        {/* Card Body */}
        <div className="p-5 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-accent">
                {product.brand} • {product.collection}
              </p>
              <Link href={href} className="link-yellow">
                <h3 className="mt-0.5 text-lg font-bold tracking-tight text-ink group-hover:text-ink">
                  {product.name}
                </h3>
              </Link>
            </div>
            <span className="shrink-0 rounded-full bg-offwhite px-2.5 py-0.5 text-[10px] font-bold text-stone-500 border border-stone-200">
              {product.thickness}
            </span>
          </div>

          <p className="text-xs text-slate-warm">{product.finish}</p>

          <div className="flex flex-wrap gap-1.5 pt-2">
            {product.sizes.slice(0, 2).map((size, i) => (
              <SizeChip key={size} size={size} index={i} />
            ))}
            {product.sizes.length > 2 && (
              <span className="inline-flex items-center rounded-full border border-dashed border-stone-300 px-2.5 py-1 text-[10px] text-stone-500">
                +{product.sizes.length - 2} formats
              </span>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

