"use client";

import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { ArrowUpRight, Sparkles, Building2, ChevronDown } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { Magnetic } from "@/components/motion/MagneticButton";
import type { HomepageHeroInput } from "@/app/admin/(dashboard)/content/homepage/schema";

export function Hero({ data }: { data: HomepageHeroInput }) {
  const HERO_IMAGE = data.heroImage;
  const HERO_VIDEO = data.heroVideo || null;
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const contentY = useTransform(scrollYProgress, [0, 0.6], ["0%", "10%"]);

  return (
    <section ref={ref} className="relative h-svh min-h-[700px] overflow-hidden bg-charcoal text-white">
      {/* Background layer */}
      <motion.div style={{ y: bgY }} className="absolute inset-0">
        {HERO_VIDEO ? (
          <video
            autoPlay
            muted
            loop
            playsInline
            poster={HERO_IMAGE}
            className="h-full w-full object-cover"
          >
            <source src={HERO_VIDEO} type="video/mp4" />
          </video>
        ) : (
          <div className="h-full w-full animate-kenburns">
            <Image
              src={HERO_IMAGE}
              alt="Luxury architectural interior finished with premium porcelain surfaces"
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/85" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
      </motion.div>

      {/* Hero content */}
      <motion.div
        style={{ opacity: contentOpacity, y: contentY }}
        className="relative z-10 flex h-full flex-col justify-end px-6 pb-28 md:px-12 lg:px-16"
      >
        <div className="mx-auto w-full max-w-[110rem]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-accent backdrop-blur-md mb-6"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {data.eyebrow || "International Luxury Architectural Surfaces"}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="text-hero max-w-5xl text-white font-bold leading-none tracking-tight"
          >
            {data.heading || "Architectural Perfection in Every Slab"}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.9 }}
            className="mt-6 max-w-2xl text-lg leading-relaxed text-stone-300 font-normal"
          >
            {data.subheading ||
              "Engineered Italian porcelain, book-matched marble slabs, and custom wellness sanitaryware curated for world-class luxury residences and commercial landmarks."}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.9 }}
            className="mt-10 flex flex-wrap items-center gap-4"
          >
            <Magnetic>
              <ButtonLink
                href="/products"
                variant="gold"
                size="lg"
                className="shadow-yellow font-bold"
              >
                Explore Collection
                <ArrowUpRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </ButtonLink>
            </Magnetic>
            <Magnetic>
              <ButtonLink
                href="/become-dealer"
                variant="outline-light"
                size="lg"
                className="border-white/30 text-white hover:bg-white hover:text-ink font-bold"
              >
                <Building2 className="h-4 w-4 text-accent" /> Dealer Enquiry
              </ButtonLink>
            </Magnetic>
          </motion.div>
        </div>
      </motion.div>

      {/* Smooth scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.8 }}
        className="absolute bottom-8 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-2 md:flex"
      >
        <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
          Scroll To Discover
        </span>
        <ChevronDown className="h-5 w-5 text-accent animate-bounce" />
      </motion.div>
    </section>
  );
}

