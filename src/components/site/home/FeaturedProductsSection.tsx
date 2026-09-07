"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { WishlistButton } from "@/components/site/catalog/WishlistButton";
import { products as fallbackProducts, type CatalogProduct } from "@/lib/catalog";

interface FeaturedProductsSectionProps {
  products?: CatalogProduct[];
}

export function FeaturedProductsSection({ products }: FeaturedProductsSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const displayProducts = products && products.length > 0 ? products : fallbackProducts;

  const handleScroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.75;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <section className="bg-white py-20 lg:py-28 overflow-hidden">
      <Container size="wide">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-12 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 mb-2">
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-ink">
                Featured Products
              </h2>
              <span className="h-[2px] w-8 bg-accent inline-block align-middle ml-2" />
            </div>
            <p className="text-xs text-slate-warm">
              Handpicked luxury surfaces directly from our exclusive shop catalog.
            </p>
          </div>

          <div className="flex items-center gap-6">
            <Link
              href="/products"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-ink hover:text-accent transition-colors"
            >
              View all products <ArrowRight className="h-3.5 w-3.5" />
            </Link>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleScroll("left")}
                aria-label="Previous products"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 text-ink hover:border-accent hover:bg-offwhite transition-all cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleScroll("right")}
                aria-label="Next products"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 text-ink hover:border-accent hover:bg-offwhite transition-all cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Product Showcase Carousel / Scroll Container */}
        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto scrollbar-none snap-x snap-mandatory py-2 -mx-4 px-4 sm:mx-0 sm:px-0"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {displayProducts.map((p, i) => {
            const badge = p.tag || (p.featured ? "Featured" : null);
            const primarySize = p.sizes && p.sizes.length > 0 ? p.sizes[0] : null;
            const subtitle = [primarySize, p.finish].filter(Boolean).join(" | ");

            return (
              <motion.div
                key={p.slug}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: Math.min(i * 0.06, 0.3), duration: 0.6 }}
                className="flex-none w-[260px] sm:w-[280px] lg:w-[calc(20%-19.2px)] min-w-[240px] snap-start"
              >
                <div className="group relative overflow-hidden rounded-[1.5rem] border border-stone-200 bg-white p-3.5 shadow-soft hover:shadow-float hover:border-accent transition-all duration-500 h-full flex flex-col justify-between">
                  <div>
                    {/* Image Stage */}
                    <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-stone-100 mb-4">
                      <Image
                        src={p.lifestyleImage || p.textureImage}
                        alt={p.name}
                        fill
                        sizes="(max-width: 768px) 80vw, 20vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />

                      {badge && (
                        <span className="absolute top-3 left-3 rounded-full bg-accent px-3 py-1 text-[10px] font-bold text-ink shadow-xs">
                          {badge}
                        </span>
                      )}

                      <div className="absolute top-3 right-3 z-10">
                        <WishlistButton slug={p.slug} name={p.name} />
                      </div>
                    </div>

                    {/* Details */}
                    <div className="space-y-1 px-1">
                      <p className="text-[10px] uppercase font-semibold tracking-wider text-amber-800">
                        {p.brand}
                      </p>
                      <Link href={`/products/${p.category}/${p.slug}`} className="block">
                        <h3 className="font-bold text-sm text-ink group-hover:text-accent transition-colors line-clamp-1">
                          {p.name}
                        </h3>
                      </Link>
                      <p className="text-[11px] text-stone-400 line-clamp-1">
                        {subtitle || p.collection}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 px-1 mt-2 border-t border-stone-100">
                    <span className="text-[11px] font-medium text-stone-500 truncate max-w-[150px]">
                      {p.collection}
                    </span>
                    <Link
                      href={`/products/${p.category}/${p.slug}`}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-stone-200 text-ink hover:border-accent hover:bg-accent transition-colors shadow-xs shrink-0"
                      aria-label={`View ${p.name}`}
                    >
                      <Plus className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
