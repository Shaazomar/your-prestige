"use client";

import { useRef, useState, type MouseEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import type { CatalogProduct } from "@/lib/catalog";
import { SizeChip } from "@/components/site/catalog/SizeChip";
import { ApplicationBadge } from "@/components/site/catalog/ApplicationBadge";
import { BrandMark } from "@/components/site/catalog/BrandMark";
import { cn } from "@/lib/utils";

const aspectClass: Record<CatalogProduct["aspect"], string> = {
  portrait: "aspect-[4/5]",
  square: "aspect-[1/1]",
  landscape: "aspect-[5/4]",
};

interface ProductCardProps {
  product: CatalogProduct;
  onQuickView: (product: CatalogProduct) => void;
  className?: string;
}

/**
 * Luxury magazine-cover product card — mouse-tracked tilt, image zoom,
 * a "lighting" glow that follows the cursor, and a full spec overlay
 * that surfaces on hover without ever feeling like an ecommerce tile.
 */
export function ProductCard({ product, onQuickView, className }: ProductCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const rotateX = useSpring(useTransform(my, [0, 1], [6, -6]), { damping: 20, stiffness: 200 });
  const rotateY = useSpring(useTransform(mx, [0, 1], [-6, 6]), { damping: 20, stiffness: 200 });
  const glowX = useTransform(mx, (v) => `${v * 100}%`);
  const glowY = useTransform(my, (v) => `${v * 100}%`);

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
        className="overflow-hidden rounded-[28px] border border-ink/8 bg-white shadow-soft transition-shadow duration-700 group-hover:shadow-float"
      >
        {/* Image stage — opens Quick View, doesn't navigate away */}
        <button
          type="button"
          onClick={() => onQuickView(product)}
          aria-label={`Quick view ${product.name}`}
          className={cn("relative block w-full overflow-hidden text-left", aspectClass[product.aspect])}
        >
          <motion.div
            animate={{ scale: hovered ? 1.09 : 1 }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            <Image
              src={product.lifestyleImage}
              alt={`${product.name} styled in a ${product.applications[0]?.toLowerCase() ?? "living"} setting`}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover"
            />
          </motion.div>

          {/* Lighting shift on hover */}
          <div
            className="absolute inset-0 bg-ink/0 transition-colors duration-700 group-hover:bg-ink/35"
            aria-hidden
          />
          <motion.div
            aria-hidden
            style={{
              background: useTransform(
                [glowX, glowY],
                ([x, y]) =>
                  `radial-gradient(480px circle at ${x} ${y}, rgb(255 255 255 / 0.16), transparent 62%)`
              ),
            }}
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100"
          />

          {/* Top chips — always visible */}
          <div className="absolute inset-x-4 top-4 flex items-start justify-between">
            {product.tag ? (
              <span className="glass-dark rounded-full px-3.5 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-gold">
                {product.tag}
              </span>
            ) : (
              <span />
            )}
            <BrandMark brand={product.brand} dark className="glass-dark border-none" />
          </div>

          {/* Texture swatch — the "actual tile image" */}
          <div className="absolute bottom-4 left-4 h-14 w-14 overflow-hidden rounded-full border-2 border-ivory/80 shadow-float transition-transform duration-700 group-hover:scale-110">
            <Image
              src={product.textureImage}
              alt={`${product.name} material close-up`}
              fill
              sizes="56px"
              className="object-cover"
            />
          </div>

          {/* Hover overlay panel */}
          <motion.div
            initial={false}
            animate={{ opacity: hovered ? 1 : 0, y: hovered ? 0 : 16 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-x-0 bottom-0 flex flex-col gap-3 bg-gradient-to-t from-ink/95 via-ink/70 to-transparent px-5 pb-5 pt-14"
          >
            <div className="flex flex-wrap gap-1.5">
              {product.applications.slice(0, 3).map((app) => (
                <ApplicationBadge key={app} application={app} size="sm" dark />
              ))}
            </div>
            <span className="group/cta flex items-center gap-2 self-start text-sm font-medium text-ivory transition-colors group-hover:text-gold">
              View Collection
              <ArrowUpRight className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-1 group-hover:-translate-y-1" />
            </span>
          </motion.div>
        </button>

        {/* Body — always visible */}
        <div className="space-y-3 p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-gold">
                {product.collection}
              </p>
              <Link href={href}>
                <h3 className="mt-1 text-xl font-semibold tracking-tight text-ink transition-colors duration-300 hover:text-gold">
                  {product.name}
                </h3>
              </Link>
            </div>
            <span className="shrink-0 rounded-full border border-ink/10 px-3 py-1 text-[0.65rem] font-medium capitalize text-stone-400">
              {product.category === "designer-picks" ? "Designer Pick" : product.category}
            </span>
          </div>

          <p className="text-sm text-slate-warm">{product.finish}</p>

          <div className="flex flex-wrap gap-2 pt-1">
            {product.sizes.slice(0, 2).map((size, i) => (
              <SizeChip key={size} size={size} index={i} />
            ))}
            {product.sizes.length > 2 && (
              <span className="inline-flex items-center rounded-full border border-dashed border-stone-300 px-3 py-1.5 text-xs text-stone-400">
                +{product.sizes.length - 2} more
              </span>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
