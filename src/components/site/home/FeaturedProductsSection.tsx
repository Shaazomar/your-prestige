"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight, Heart, Plus } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { WishlistButton } from "@/components/site/catalog/WishlistButton";

const showcaseProducts = [
  {
    slug: "carrara-lumina-slab",
    name: "Calacatta Oro",
    size: "120x240 cm",
    finish: "Glossy",
    price: "₹245 / sq.ft",
    tag: "New",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=600&auto=format&fit=crop",
    category: "tiles",
  },
  {
    slug: "travertine-classico",
    name: "Statuario Venato",
    size: "120x120 cm",
    finish: "Matte",
    price: "₹198 / sq.ft",
    tag: null,
    image: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?q=80&w=600&auto=format&fit=crop",
    category: "tiles",
  },
  {
    slug: "basalt-noir-matte",
    name: "Armani Grey",
    size: "120x240 cm",
    finish: "Glossy",
    price: "₹226 / sq.ft",
    tag: null,
    image: "https://images.unsplash.com/photo-1541123437800-1bb1317badc2?q=80&w=600&auto=format&fit=crop",
    category: "tiles",
  },
  {
    slug: "limestone-honed",
    name: "Travertino Beige",
    size: "60x120 cm",
    finish: "Matte",
    price: "₹145 / sq.ft",
    tag: null,
    image: "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?q=80&w=600&auto=format&fit=crop",
    category: "tiles",
  },
  {
    slug: "onyx-bianco-slab",
    name: "Onyx Bianco",
    size: "120x240 cm",
    finish: "Glossy",
    price: "₹265 / sq.ft",
    tag: null,
    image: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=600&auto=format&fit=crop",
    category: "tiles",
  },
];

export function FeaturedProductsSection() {
  const [scrollIndex, setScrollIndex] = useState(0);

  return (
    <section className="bg-white py-20 lg:py-28">
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
            <p className="text-xs text-slate-warm">Engineered for luxury penthouses and high-traffic spaces.</p>
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
                aria-label="Previous products"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 text-ink hover:border-accent hover:bg-offwhite transition-all"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                aria-label="Next products"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 text-ink hover:border-accent hover:bg-offwhite transition-all"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Product Showcase Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {showcaseProducts.map((p, i) => (
            <motion.div
              key={p.slug}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.7 }}
            >
              <div className="group relative overflow-hidden rounded-[1.5rem] border border-stone-200 bg-white p-3.5 shadow-soft hover:shadow-float hover:border-accent transition-all duration-500">
                {/* Image Stage */}
                <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-stone-100 mb-4">
                  <Image
                    src={p.image}
                    alt={p.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 20vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />

                  {p.tag && (
                    <span className="absolute top-3 left-3 rounded-full bg-accent px-3 py-1 text-[10px] font-bold text-ink shadow-xs">
                      {p.tag}
                    </span>
                  )}

                  <div className="absolute top-3 right-3 z-10">
                    <WishlistButton slug={p.slug} name={p.name} />
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-1.5 px-1">
                  <Link href={`/products/${p.category}/${p.slug}`} className="block">
                    <h3 className="font-bold text-sm text-ink group-hover:text-accent transition-colors">
                      {p.name}
                    </h3>
                  </Link>
                  <p className="text-[11px] text-stone-400">
                    {p.size} | {p.finish}
                  </p>
                  <div className="flex items-center justify-between pt-2">
                    <span className="font-bold text-xs text-ink">{p.price}</span>
                    <Link
                      href={`/products/${p.category}/${p.slug}`}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-stone-200 text-ink hover:border-accent hover:bg-accent transition-colors shadow-xs"
                      aria-label={`View ${p.name}`}
                    >
                      <Plus className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}
