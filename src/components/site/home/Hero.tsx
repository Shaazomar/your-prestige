"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Download } from "lucide-react";
import { Container } from "@/components/ui/Container";
import type { HomepageHeroInput } from "@/app/admin/(dashboard)/content/homepage/schema";
import { HeroVideo } from "./hero/HeroVideo";

export function Hero({ data }: { data: HomepageHeroInput }) {
  const heroImage =
    data.heroImage ||
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1600&auto=format&fit=crop";

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
