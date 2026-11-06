"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";

interface CatalogueHeroProps {
  eyebrow?: string;
  title?: string;
  description?: string;
  heroImage?: string;
  /** Optional showcase video; falls back to the image (or nothing) if it fails to load. */
  heroVideo?: string;
  heroPoster?: string;
  /**
   * Render the text-only hero when there is no media to show, instead of the
   * stock default image. For pages (a brand's category) where an unrelated
   * stock photo would be worse than none.
   */
  hideMedia?: boolean;
}

export function CatalogueHero({
  eyebrow = "THE CATALOGUE",
  title = "An archive worth\nexploring.",
  description = "Filter by room, brand or finish — then step into the showroom to see every piece at full scale.",
  heroImage = "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1600&auto=format&fit=crop",
  heroVideo,
  heroPoster,
  hideMedia = false,
}: CatalogueHeroProps) {
  const [videoFailed, setVideoFailed] = useState(false);
  const showVideo = !!heroVideo && !videoFailed;
  // Split title lines if multiline or formatted
  const titleLines = title.split("\n");

  return (
    /*
      Vertical budget matters here in a way it doesn't on an editorial page:
      this hero sits on top of every product listing (/products, /tiles,
      /bathware, every brand and category page). At its previous proportions
      — pt-36 + a 520px media panel + pb-16 — it filled the entire first
      screen at 1440x900 and at 390x844, so a visitor landing on the shop
      saw no product, and not even the search/filter bar, until they
      scrolled: measured first-card offsets were 955px (laptop) and 981px
      (mobile) against viewports of 900 and 844.

      The opener is kept — it is the page's identity and its h1 — but tuned
      to a band rather than a full screen, so the toolbar and the first row
      of products are reachable immediately.
    */
    <section className="relative overflow-hidden bg-white pt-24 pb-8 lg:pt-28 lg:pb-10">
      {/* SVG Organic Clip Path Definition */}
      <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
        <defs>
          <clipPath id="catalogue-hero-organic-clip" clipPathUnits="objectBoundingBox">
            <path d="M 0.35,0 C 0.12,0 0,0.12 0,0.30 C 0,0.56 0.04,0.72 0.01,0.88 C 0.01,0.96 0.10,1 0.22,1 L 0.65,1 C 0.85,1 1,0.85 1,0.65 L 1,0.22 C 1,0.06 0.85,0 0.68,0 Z" />
          </clipPath>
        </defs>
      </svg>

      <Container size="wide">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
          {/* Left Editorial Copy */}
          <div className={hideMedia ? "lg:col-span-12 space-y-6 z-10" : "lg:col-span-6 space-y-6 z-10"}>
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2.5"
            >
              <span className="text-xs font-bold uppercase tracking-[0.25em] text-stone-500">
                {eyebrow}
              </span>
              <span className="h-[2px] w-8 bg-accent" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, filter: "blur(10px)", y: 20 }}
              animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="font-serif text-4xl sm:text-5xl lg:text-[4.25rem] leading-[1.08] font-bold tracking-tight text-ink"
            >
              {titleLines[0]}
              {titleLines[1] && (
                <>
                  <br />
                  <span className="italic font-normal text-slate-warm">{titleLines[1]}</span>
                </>
              )}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.25 }}
              className="max-w-xl text-base sm:text-lg leading-relaxed text-slate-warm"
            >
              {description}
            </motion.p>
          </div>

          {/* Right Organic Architectural Imagery */}
          {!hideMedia && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            /*
              Hidden below `sm`. On a phone the media panel stacks between
              the headline and the filter toolbar, which pushed the first
              product to 897px against an 844px viewport — so the shop still
              opened on no products. On a listing page the products are the
              photography; the decorative panel is the part that gives way.
              It returns from `sm` up, where it costs nothing.
            */
            className="hidden sm:block lg:col-span-6 relative pt-4 lg:pt-0"
          >
            <div className="relative w-full aspect-[5/3] sm:aspect-[16/10] lg:h-[360px] group">
              {/* Outer Prestige Gold Organic Outline Accent */}
              <div className="absolute -inset-2 pointer-events-none z-10">
                <motion.svg
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  className="w-full h-full overflow-visible"
                  animate={{ opacity: [0.6, 0.85, 0.6] }}
                  transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                >
                  <path
                    d="M 35,0.5 C 12,0.5 0.5,12 0.5,30 C 0.5,56 4,72 1.3,88 C 1.3,96 10,99.5 22,99.5 L 65,99.5 C 85,99.5 99.5,85 99.5,65 L 99.5,22 C 99.5,6 85,0.5 68,0.5 Z"
                    fill="none"
                    stroke="#F6C600"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                  />
                </motion.svg>
              </div>

              {/* Organic Mask Container */}
              <div
                className="relative w-full h-full shadow-[0_25px_60px_rgba(0,0,0,0.12)] overflow-hidden transition-all duration-700 group-hover:scale-[1.015]"
                style={{
                  clipPath: "url(#catalogue-hero-organic-clip)",
                  WebkitClipPath: "url(#catalogue-hero-organic-clip)",
                }}
              >
                {showVideo ? (
                  <video
                    src={heroVideo}
                    poster={heroPoster}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    aria-hidden="true"
                    onError={() => setVideoFailed(true)}
                    className="absolute inset-0 h-full w-full object-cover object-center"
                  />
                ) : (
                  <Image
                    src={heroImage}
                    alt="Architectural tile & surface archive preview"
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover object-center transition-transform duration-1000 ease-out group-hover:scale-105"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 pointer-events-none" />
              </div>

              {/* Subtle Floating Glass Badge */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="absolute bottom-6 left-6 sm:left-8 z-20 rounded-2xl border border-white/30 bg-white/70 p-4 sm:p-5 shadow-lg backdrop-blur-md max-w-xs"
              >
                <p className="text-xs font-serif font-bold text-ink leading-tight">Curated surfaces.</p>
                <p className="text-xs font-serif font-bold text-stone-600 leading-tight">Timeless spaces.</p>
                <p className="text-[11px] font-medium text-stone-500 mt-1">Endless inspiration.</p>
              </motion.div>
            </div>
          </motion.div>
          )}
        </div>
      </Container>
    </section>
  );
}
