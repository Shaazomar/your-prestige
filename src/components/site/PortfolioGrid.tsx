"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { portfolioProjects } from "@/lib/demo-content";
import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/utils";

const filters = ["All", "Villa", "Apartment", "Hotel", "Commercial"] as const;

export function PortfolioGrid() {
  const [active, setActive] = useState<(typeof filters)[number]>("All");
  const visible =
    active === "All"
      ? portfolioProjects
      : portfolioProjects.filter((p) => p.type === active);

  return (
    <section className="bg-ivory py-20 md:py-28">
      <Container size="wide">
        {/* Filter pills */}
        <div className="mb-14 flex flex-wrap gap-3">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setActive(f)}
              className={cn(
                "rounded-full border px-6 py-2.5 text-sm font-medium transition-all duration-500",
                active === f
                  ? "border-ink bg-ink text-ivory"
                  : "border-ink/15 text-slate-warm hover:border-ink/40"
              )}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Projects */}
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
                className="group"
              >
                <div className="relative overflow-hidden rounded-3xl">
                  <div className="relative aspect-[16/11]">
                    <Image
                      src={p.image}
                      alt={p.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover transition-transform duration-[1.4s] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-107"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
                  </div>
                  <div className="glass-dark absolute left-5 top-5 rounded-full px-4 py-1.5 text-xs font-medium text-ivory">
                    {p.type} · {p.year}
                  </div>
                  <div className="absolute inset-x-0 bottom-0 p-8">
                    <h3 className="text-2xl font-semibold tracking-tight text-ivory md:text-3xl">
                      {p.title}
                    </h3>
                    <p className="mt-1 text-sm text-ivory/60">{p.location}</p>
                  </div>
                </div>
                <p className="mt-4 px-1 leading-relaxed text-slate-warm">{p.description}</p>
              </motion.article>
            ))}
          </AnimatePresence>
        </motion.div>
      </Container>
    </section>
  );
}
