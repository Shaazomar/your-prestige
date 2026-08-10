"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Search, RotateCcw } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { CatalogueHero } from "@/components/site/catalog/CatalogueHero";
import { cn } from "@/lib/utils";

const collectionsList = [
  {
    title: "Lumina Marble Collection",
    subtitle: "Italian Statuario & Carrara Porcelain Slabs",
    description: "Luminous white fields with soft charcoal vein lines. Book-matched laying option creates continuous vein flows across large salon floors.",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1600&auto=format&fit=crop",
    link: "/products?collection=Lumina+Marble+Collection",
    itemCount: "14 Slabs",
    finishes: "Polished & Honed",
    category: "Marble",
  },
  {
    title: "Volcanica Basalt Series",
    subtitle: "Honed Volcanic Surface vitrified tiles",
    description: "Deep charcoal matte basalt engineered with tactile volcanic micro-structure. Slip-resistant enough for verandahs, refined enough for boardroom lobbies.",
    image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=1600&auto=format&fit=crop",
    link: "/products?collection=Volcanica+Collection",
    itemCount: "8 Formats",
    finishes: "Matte & Structured R11",
    category: "Basalt",
  },
  {
    title: "Antico Stone Series",
    subtitle: "Fossilised Tuscan Travertine Porcelain",
    description: "Sun-warmed travertine with natural fossilised pitting. Engineered for warmth and consistency across coastal villas.",
    image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?q=80&w=1600&auto=format&fit=crop",
    link: "/products?collection=Antico+Stone+Collection",
    itemCount: "12 Formats",
    finishes: "Honed Vitrified",
    category: "Travertine",
  },
  {
    title: "Sanctuary Bath Series",
    subtitle: "Sculptural Soaking Tubs & Sanitaryware",
    description: "Minimalist bath silhouettes and PVD brushed gold wellness rain systems designed to elevate daily ritual into spa indulgence.",
    image: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?q=80&w=1600&auto=format&fit=crop",
    link: "/products?category=sanitary",
    itemCount: "18 Pieces",
    finishes: "Alpine White & Gold PVD",
    category: "Sanitaryware",
  },
  {
    title: "Exterra Outdoor Series",
    subtitle: "20mm Heavy-Duty Architectural Pavers",
    description: "Monolithic 20mm porcelain slabs built for poolside decks, open driveways, and high-footfall public plazas.",
    image: "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?q=80&w=1600&auto=format&fit=crop",
    link: "/products?collection=Exterra+Outdoor+Collection",
    itemCount: "10 Formats",
    finishes: "Structured Anti-Slip",
    category: "Outdoor",
  },
  {
    title: "Culina Surface Series",
    subtitle: "Ultra-Compact Countertop Slabs",
    description: "12mm stain-proof quartz surfaces engineered to wrap waterfall kitchen islands without visible seams.",
    image: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=1600&auto=format&fit=crop",
    link: "/products?collection=Culina+Surface+Collection",
    itemCount: "9 Slabs",
    finishes: "Ultra-Polish & Satin",
    category: "Countertops",
  },
];

const CATEGORIES = ["All", "Marble", "Basalt", "Travertine", "Sanitaryware", "Outdoor", "Countertops"];

export default function CollectionsPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const filteredCollections = useMemo(() => {
    const q = search.trim().toLowerCase();
    return collectionsList.filter((c) => {
      if (activeCategory !== "All" && c.category !== activeCategory) return false;
      if (q) {
        const haystack = `${c.title} ${c.subtitle} ${c.description} ${c.finishes}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [search, activeCategory]);

  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <CatalogueHero
        eyebrow="CURATED DESIGN FAMILIES"
        title={"Architectural\nCollections."}
        description="Explore our master collections, grouped by material origin, tactile finish, and design philosophy."
        heroImage="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1600&auto=format&fit=crop"
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
                placeholder="Search collections, finishes, materials…"
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

      {/* Collections Showcase Grid */}
      <section className="bg-white pb-28">
        <Container size="wide">
          <div className="space-y-16">
            {filteredCollections.map((col, index) => (
              <div
                key={col.title}
                className={cn(
                  "group grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center rounded-3xl border border-stone-200/70 bg-white p-6 sm:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.03)] transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] hover:border-gold/30"
                )}
              >
                {/* Collection Image Stage */}
                <div
                  className={cn(
                    "relative h-[360px] sm:h-[440px] w-full overflow-hidden rounded-2xl lg:col-span-7 bg-stone-100",
                    index % 2 === 1 ? "lg:order-2" : ""
                  )}
                >
                  <Image
                    src={col.image}
                    alt={col.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 55vw"
                    className="object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
                  />
                  <div className="absolute top-4 left-4 flex flex-wrap gap-2 z-10">
                    <span className="rounded-full bg-black/70 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-accent backdrop-blur-md border border-white/10 shadow-xs">
                      {col.itemCount}
                    </span>
                    <span className="rounded-full bg-white/90 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-ink backdrop-blur-md shadow-xs">
                      {col.finishes}
                    </span>
                  </div>
                </div>

                {/* Collection Content */}
                <div className={cn("lg:col-span-5 space-y-5", index % 2 === 1 ? "lg:order-1" : "")}>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gold">
                    {col.category} Series
                  </span>
                  <h2 className="font-serif text-3xl sm:text-4xl font-bold text-ink leading-tight">
                    {col.title}
                  </h2>
                  <p className="text-sm font-semibold text-slate-warm">{col.subtitle}</p>
                  <p className="text-sm text-stone-500 leading-relaxed">{col.description}</p>
                  <div className="pt-2">
                    <Link
                      href={col.link}
                      className="inline-flex items-center gap-2 rounded-full bg-ink px-7 py-3.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-gold hover:text-ink transition-all duration-300 shadow-md group/btn"
                    >
                      <span>Explore Collection</span>
                      <ArrowRight className="h-4 w-4 text-gold group-hover/btn:text-ink transition-transform duration-300 group-hover/btn:translate-x-1" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>
    </main>
  );
}

