"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Download } from "lucide-react";
import { Container } from "@/components/ui/Container";
import type { HomepageHeroInput } from "@/app/admin/(dashboard)/content/homepage/schema";
import { HeroVideo } from "./hero/HeroVideo";

export function Hero({ data }: { data: HomepageHeroInput }) {
  const eyebrow = data?.eyebrow || "CRAFTING SURFACES";
  const heading = data?.heading || "Surfaces that Inspire Spaces";
  const subheading =
    data?.subheading ||
    "Premium tiles crafted with precision, inspired by nature, designed for timeless spaces.";
  const heroImage =
    data?.heroImage ||
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1600&auto=format&fit=crop";

  const primaryLabel = data?.primaryCtaLabel || "Explore Collections";
  const primaryHref = data?.primaryCtaHref || "/products";
  const secondaryLabel = data?.secondaryCtaLabel || "Download Catalogue";
  const secondaryHref = data?.secondaryCtaHref || "/catalogue";

  return (
    <section className="relative overflow-hidden bg-white pt-28 pb-16 lg:pt-36 lg:pb-24">
      <Container size="wide">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          {/* Left Column Text & CTAs */}
          <div className="lg:col-span-6 space-y-8 z-10 lg:self-center">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="inline-flex items-center gap-2"
            >
              <span className="text-xs font-bold uppercase tracking-[0.25em] text-stone-500">
                {eyebrow}
              </span>
              <span className="h-[2px] w-8 bg-accent" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, filter: "blur(12px)", y: 24 }}
              animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
              transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
              className="font-serif text-5xl sm:text-6xl lg:text-[4.25rem] leading-[1.06] font-bold tracking-tight text-ink whitespace-pre-line"
            >
              {heading}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="max-w-xl text-base sm:text-lg leading-relaxed text-slate-warm"
            >
              {subheading}
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex flex-wrap items-center gap-4 pt-2"
            >
              {primaryLabel && primaryHref && (
                <Link
                  href={primaryHref}
                  className="inline-flex items-center gap-2 rounded-full bg-accent px-8 py-4 text-xs font-bold uppercase tracking-wider text-ink hover:bg-accent-hover transition-all duration-300 shadow-yellow group"
                >
                  {primaryLabel}
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              )}

              {secondaryLabel && secondaryHref && (
                <Link
                  href={secondaryHref}
                  className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-7 py-4 text-xs font-bold uppercase tracking-wider text-ink hover:border-ink transition-all duration-300 shadow-xs"
                >
                  {secondaryLabel}
                  <Download className="h-4 w-4 text-slate-warm" />
                </Link>
              )}
            </motion.div>

            {/* Trust Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="flex items-center gap-4 pt-4 border-t border-stone-100"
            >
              {/*
                Previously three Unsplash portraits of real, unrelated people,
                captioned as the architects and designers who trust this
                showroom — fabricated social proof built from strangers'
                photographs. They were also bare `next/image` rather than
                `SafeImage`, so when the host was unreachable the hero
                rendered three broken-image glyphs directly under the
                headline.

                A non-photographic monogram cluster makes the same visual
                point, claims nothing about specific people, needs no network
                request, and cannot break. Swap in real client logos or
                credited portraits once there are ones the business owns.
              */}
              <div className="flex -space-x-3" aria-hidden="true">
                {["A", "D", "S"].map((initial, i) => (
                  <span
                    key={initial}
                    className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-[#efece4] to-[#ded9cc] text-[11px] font-semibold tracking-wide text-ink/55 shadow-sm"
                    style={{ zIndex: 3 - i }}
                  >
                    {initial}
                  </span>
                ))}
              </div>
              <div>
                <p className="text-xs font-bold text-ink">Trusted by 1500+ Architects & Designers</p>
                <p className="text-[11px] text-stone-400">Across 25+ Countries</p>
              </div>
            </motion.div>
          </div>

          {/* Right Column Organic Hero Video Composition */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            className="lg:col-span-6 relative pt-4 lg:pt-0"
          >
            <HeroVideo posterImage={heroImage} videoSrc={data.heroVideo} />
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
