"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Download, Play, X } from "lucide-react";
import { Container } from "@/components/ui/Container";
import type { HomepageHeroInput } from "@/app/admin/(dashboard)/content/homepage/schema";

export function Hero({ data }: { data: HomepageHeroInput }) {
  const [videoOpen, setVideoOpen] = useState(false);

  const heroImage =
    data.heroImage ||
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1600&auto=format&fit=crop";

  return (
    <>
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
                  CRAFTING SURFACES
                </span>
                <span className="h-[2px] w-8 bg-accent" />
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, filter: "blur(12px)", y: 24 }}
                animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                className="font-serif text-5xl sm:text-6xl lg:text-[4.25rem] leading-[1.06] font-bold tracking-tight text-ink"
              >
                Surfaces that <br />
                <span className="italic font-normal">Inspire Spaces</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="max-w-xl text-base sm:text-lg leading-relaxed text-slate-warm"
              >
                {data.subheading ||
                  "Premium tiles crafted with precision, inspired by nature, designed for timeless spaces."}
              </motion.p>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="flex flex-wrap items-center gap-4 pt-2"
              >
                <Link
                  href="/products"
                  className="inline-flex items-center gap-2 rounded-full bg-accent px-8 py-4 text-xs font-bold uppercase tracking-wider text-ink hover:bg-accent-hover transition-all duration-300 shadow-yellow group"
                >
                  Explore Collections
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>

                <Link
                  href="/catalogue"
                  className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-7 py-4 text-xs font-bold uppercase tracking-wider text-ink hover:border-ink transition-all duration-300 shadow-xs"
                >
                  Download Catalogue
                  <Download className="h-4 w-4 text-slate-warm" />
                </Link>
              </motion.div>

              {/* Trust Badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="flex items-center gap-4 pt-4 border-t border-stone-100"
              >
                <div className="flex -space-x-3">
                  <Image
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop"
                    alt="Architect avatar"
                    width={40}
                    height={40}
                    className="rounded-full border-2 border-white object-cover"
                  />
                  <Image
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop"
                    alt="Designer avatar"
                    width={40}
                    height={40}
                    className="rounded-full border-2 border-white object-cover"
                  />
                  <Image
                    src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop"
                    alt="Architect avatar"
                    width={40}
                    height={40}
                    className="rounded-full border-2 border-white object-cover"
                  />
                </div>
                <div>
                  <p className="text-xs font-bold text-ink">Trusted by 1500+ Architects & Designers</p>
                  <p className="text-[11px] text-stone-400">Across 25+ Countries</p>
                </div>
              </motion.div>
            </div>

            {/* Right Column Image Stage with Organic Arch Cutout */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
              className="lg:col-span-6 relative"
            >
              <div className="group relative aspect-[4/3] sm:aspect-[14/11] w-full overflow-hidden rounded-[2.5rem] shadow-float border border-stone-200/80 bg-stone-100">
                <Image
                  src={heroImage}
                  alt="Luxury living room featuring book-matched porcelain tiles"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover transition-transform duration-1000 group-hover:scale-105"
                />

                {/* Floating Play Story Button */}
                <button
                  onClick={() => setVideoOpen(true)}
                  className="absolute bottom-6 left-6 flex items-center gap-3 rounded-full bg-white/90 px-5 py-3 text-xs font-bold text-ink backdrop-blur-md border border-white/50 shadow-float hover:bg-white hover:scale-105 transition-all duration-300"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-ink shadow-xs">
                    <Play className="h-3.5 w-3.5 fill-ink ml-0.5" />
                  </span>
                  <div className="text-left">
                    <span className="block font-bold">Watch Story</span>
                    <span className="block text-[10px] text-stone-400 font-normal">1:25 min</span>
                  </div>
                </button>
              </div>
            </motion.div>
          </div>
        </Container>

      </section>

      {/* Video Modal Trigger */}
      {videoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-4xl overflow-hidden rounded-3xl bg-charcoal shadow-2xl">
            <button
              onClick={() => setVideoOpen(false)}
              className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white hover:text-ink transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="relative aspect-video w-full">
              <iframe
                src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
                title="Prestige Tiles Brand Story"
                className="h-full w-full border-0"
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
