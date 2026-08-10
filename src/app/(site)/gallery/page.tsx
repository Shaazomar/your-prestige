"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { CatalogueHero } from "@/components/site/catalog/CatalogueHero";
import { galleryImages } from "@/lib/demo-content";
import { RevealStagger, RevealItem } from "@/components/motion/Reveal";
import { Search, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

const galleryItemsWithCategories = galleryImages.map((img, i) => ({
  ...img,
  id: `gallery-img-${i}`,
  category: i % 4 === 0 ? "Bathrooms" : i % 4 === 1 ? "Living Spaces" : i % 4 === 2 ? "Kitchens" : "Exteriors",
}));

const CATEGORIES = ["All", "Bathrooms", "Living Spaces", "Kitchens", "Exteriors"];

export default function GalleryPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const wall = useMemo(() => {
    const doubleWall = [...galleryItemsWithCategories, ...galleryItemsWithCategories.slice(0, 4)];
    const q = search.trim().toLowerCase();
    return doubleWall.filter((img) => {
      if (activeCategory !== "All" && img.category !== activeCategory) return false;
      if (q) {
        const haystack = `${img.alt} ${img.category}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [search, activeCategory]);

  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <CatalogueHero
        eyebrow="THE GALLERY"
        title={"Every image,\na finished promise."}
        description="Real spaces, real projects — photographed as delivered across coastal Karnataka."
        heroImage="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=1600&auto=format&fit=crop"
      />

      {/* Floating Filter & Search Control Panel */}
      <div className="relative z-20 mx-auto max-w-[110rem] px-4 sm:px-6 lg:px-10 -mt-2 mb-12">
        <div className="rounded-3xl border border-stone-200/80 bg-white p-4 sm:p-5 shadow-[0_8px_30px_rgba(0,0,0,0.06)] space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search gallery by space, surface type…"
                className="w-full rounded-full border border-stone-200 bg-stone-50/70 py-2.5 pl-11 pr-4 text-xs font-medium outline-none transition-all focus:border-gold focus:bg-white"
              />
            </div>
            {(search || activeCategory !== "All") && (
              <button
                onClick={() => {
                  setSearch("");
                  setActiveCategory("All");
                }}
                className="flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-ink transition-colors"
              >
                <RotateCcw className="h-3 w-3 text-gold" />
                Reset
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
            {CATEGORIES.map((cat) => {
              const active = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-all duration-300 border",
                    active
                      ? "bg-black text-white border-black shadow-sm"
                      : "bg-white text-stone-600 border-stone-200 hover:border-gold hover:text-ink"
                  )}
                >
                  {active && <span className="h-1.5 w-1.5 rounded-full bg-gold" />}
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Gallery Masonry Wall */}
      <section className="bg-white pb-28">
        <Container size="wide">
          <RevealStagger
            className="columns-2 gap-5 md:columns-3 lg:columns-4 [&>*]:mb-5"
            stagger={0.05}
          >
            {wall.map((img, i) => (
              <RevealItem key={`${img.src}-${i}`}>
                <div className="group relative overflow-hidden rounded-2xl border border-stone-200/60 bg-stone-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-all duration-500 hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)] hover:border-gold/40">
                  <div className={cn("relative w-full", img.tall ? "aspect-[3/4]" : "aspect-square")}>
                    <Image
                      src={img.src}
                      alt={img.alt}
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      className="object-cover transition-transform duration-1000 ease-out group-hover:scale-108"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-5 opacity-0 transition-opacity duration-500 group-hover:opacity-100 flex flex-col justify-end">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-accent mb-1">
                        {img.category}
                      </span>
                      <p className="text-xs font-medium text-white/90 leading-snug">{img.alt}</p>
                    </div>
                  </div>
                </div>
              </RevealItem>
            ))}
          </RevealStagger>

          {wall.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-stone-300 bg-stone-50/50 py-20 text-center px-4">
              <p className="text-xl font-bold font-serif text-ink">No matching gallery photos found</p>
              <p className="mt-2 text-xs text-stone-500 max-w-sm">
                Try searching for bathroom, living, or exterior.
              </p>
            </div>
          )}
        </Container>
      </section>
    </main>
  );
}

