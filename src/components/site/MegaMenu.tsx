"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowUpRight, Sparkles, Layers, Download } from "lucide-react";
import { applicationsData } from "@/lib/applications";

export function MegaMenu({ onClose }: { onClose: () => void }) {
  const categories = [
    { name: "Luxury Porcelain Tiles", href: "/products/tiles", desc: "Large format book-matched marble & stone slabs." },
    { name: "Sanitaryware & Spa", href: "/products/sanitary", desc: "Freestanding tubs, wall-hung WCs, and brassware." },
    { name: "Designer Picks 2026", href: "/products/designer-picks", desc: "Hand-picked architectural surface trends." },
  ];

  const featuredCollections = [
    { name: "Lumina Marble", href: "/collections", tag: "Polished Slabs" },
    { name: "Basalt Noir", href: "/collections", tag: "Honed Texture" },
    { name: "Travertine Classico", href: "/collections", tag: "Natural Vein" },
    { name: "Calacatta Gold", href: "/collections", tag: "Book-matched" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: 10, filter: "blur(4px)" }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-full max-w-5xl rounded-3xl border border-stone-200/90 bg-white/95 p-8 shadow-float backdrop-blur-xl z-50 text-ink"
      onMouseLeave={onClose}
    >
      <div className="grid grid-cols-12 gap-8">
        {/* Categories Column */}
        <div className="col-span-4 border-r border-stone-100 pr-6 space-y-6">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent">
            <Layers className="h-4 w-4" /> Category Directory
          </div>
          <div className="space-y-4">
            {categories.map((cat) => (
              <Link
                key={cat.href}
                href={cat.href}
                onClick={onClose}
                className="group block rounded-xl p-3 hover:bg-offwhite transition-colors"
              >
                <div className="flex items-center justify-between font-bold text-sm text-ink group-hover:text-accent transition-colors">
                  {cat.name}
                  <ArrowUpRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-xs text-slate-warm mt-0.5">{cat.desc}</p>
              </Link>
            ))}
          </div>

          <div className="pt-2 border-t border-stone-100">
            <Link
              href="/catalogue"
              onClick={onClose}
              className="inline-flex items-center gap-2 text-xs font-bold text-ink hover:text-accent transition-colors"
            >
              <Download className="h-4 w-4 text-accent" /> Download 2026 Lookbook PDF
            </Link>
          </div>
        </div>

        {/* Featured Collections */}
        <div className="col-span-4 border-r border-stone-100 pr-6 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent">
            <Sparkles className="h-4 w-4" /> Master Collections
          </div>
          <div className="grid grid-cols-2 gap-3">
            {featuredCollections.map((col, i) => (
              <Link
                key={i}
                href={col.href}
                onClick={onClose}
                className="group rounded-xl border border-stone-200 p-3 hover:border-accent hover:bg-offwhite transition-all"
              >
                <span className="block text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  {col.tag}
                </span>
                <span className="block font-bold text-xs text-ink group-hover:text-accent transition-colors mt-0.5">
                  {col.name}
                </span>
              </Link>
            ))}
          </div>

          <div className="rounded-2xl bg-charcoal text-white p-4 space-y-2 mt-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-accent block">Architectural Service</span>
            <p className="text-xs text-stone-300">Request physical sample swatches delivered directly to your studio desk.</p>
            <Link
              href="/request-quote"
              onClick={onClose}
              className="inline-block text-xs font-bold text-accent hover:underline pt-1"
            >
              Request Swatch Box →
            </Link>
          </div>
        </div>

        {/* Popular Applications Preview */}
        <div className="col-span-4 space-y-4">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-accent">
            <span>By Application</span>
            <Link href="/applications" onClick={onClose} className="text-[10px] text-stone-400 hover:text-ink">
              View All 10
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {applicationsData.slice(0, 4).map((app) => (
              <Link
                key={app.slug}
                href={`/applications/${app.slug}`}
                onClick={onClose}
                className="group relative h-24 overflow-hidden rounded-xl border border-stone-200 shadow-xs"
              >
                <Image
                  src={app.image}
                  alt={app.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-2 left-2 text-white text-[11px] font-bold leading-tight group-hover:text-accent transition-colors">
                  {app.title}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
