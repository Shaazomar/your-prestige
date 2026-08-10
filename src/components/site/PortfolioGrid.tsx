"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Search, RotateCcw, MapPin, Calendar } from "lucide-react";
import { portfolioProjects } from "@/lib/demo-content";
import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/utils";

const filters = ["All", "Villa", "Apartment", "Hotel", "Commercial"] as const;

export function PortfolioGrid() {
  const [active, setActive] = useState<(typeof filters)[number]>("All");
  const [search, setSearch] = useState("");

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return portfolioProjects.filter((p) => {
      if (active !== "All" && p.type !== active) return false;
      if (q) {
        const haystack = `${p.title} ${p.type} ${p.location} ${p.description}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [active, search]);

  return (
    <section className="bg-white pb-28">
      {/* Floating Filter & Search Control Panel */}
      <div className="relative z-20 mx-auto max-w-[110rem] px-4 sm:px-6 lg:px-10 -mt-2 mb-12">
        <div className="rounded-3xl border border-stone-200/80 bg-white p-4 sm:p-5 shadow-[0_8px_30px_rgba(0,0,0,0.06)] space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search projects by name, location, type…"
                className="w-full rounded-full border border-stone-200 bg-stone-50/70 py-2.5 pl-11 pr-4 text-xs font-medium outline-none transition-all focus:border-gold focus:bg-white"
              />
            </div>
            {(search || active !== "All") && (
              <button
                onClick={() => {
                  setSearch("");
                  setActive("All");
                }}
                className="flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-ink transition-colors"
              >
                <RotateCcw className="h-3 w-3 text-gold" />
                Reset
              </button>
            )}
          </div>

          {/* Project Type Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
            {filters.map((f) => {
              const isActive = active === f;
              return (
                <button
                  key={f}
                  onClick={() => setActive(f)}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-all duration-300 border",
                    isActive
                      ? "bg-black text-white border-black shadow-sm"
                      : "bg-white text-stone-600 border-stone-200 hover:border-gold hover:text-ink"
                  )}
                >
                  {isActive && <span className="h-1.5 w-1.5 rounded-full bg-gold" />}
                  {f}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <Container size="wide">
        {/* Projects Grid */}
        <motion.div layout className="grid gap-8 md:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {visible.map((p) => (
              <motion.article
                layout
                key={p.slug}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="group flex flex-col h-full rounded-3xl border border-stone-200/80 bg-white overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.03)] transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] hover:border-gold/40"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-stone-100">
                  <Image
                    src={p.image}
                    alt={p.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10" />

                  {/* Type Badge */}
                  <div className="absolute left-5 top-5 rounded-full border border-white/20 bg-black/60 px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-accent backdrop-blur-md shadow-xs">
                    {p.type}
                  </div>

                  {/* Title Overlay */}
                  <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8 space-y-1">
                    <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white leading-tight">
                      {p.title}
                    </h3>
                    <div className="flex items-center gap-4 text-xs font-medium text-white/80">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-gold" />
                        {p.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-gold" />
                        {p.year}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Project Description */}
                <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between">
                  <p className="text-sm leading-relaxed text-stone-600">{p.description}</p>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </motion.div>

        {visible.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-stone-300 bg-stone-50/50 py-20 text-center px-4">
            <p className="text-xl font-bold font-serif text-ink">No matching landmark projects found</p>
            <p className="mt-2 text-xs text-stone-500 max-w-sm">
              Try search keywords like villa, apartment, or location.
            </p>
          </div>
        )}
      </Container>
    </section>
  );
}
