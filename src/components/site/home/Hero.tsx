"use client";

import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { ArrowUpRight, MapPin } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { Magnetic } from "@/components/motion/MagneticButton";
import { TextReveal } from "@/components/motion/TextReveal";
import type { HomepageHeroInput } from "@/app/admin/(dashboard)/content/homepage/schema";

export function Hero({ data }: { data: HomepageHeroInput }) {
  const HERO_IMAGE = data.heroImage;
  const HERO_VIDEO = data.heroVideo || null;
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const contentY = useTransform(scrollYProgress, [0, 0.6], ["0%", "12%"]);

  return (
    <section ref={ref} className="relative h-svh min-h-[640px] overflow-hidden bg-ink">
      {/* Cinematic media layer */}
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
              alt="Luxury interior finished with premium Italian marble surfaces"
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          </div>
        )}
        {/* Cinematic grade */}
        <div className="absolute inset-0 bg-gradient-to-b from-ink/70 via-ink/30 to-ink/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/50 to-transparent" />
      </motion.div>

      {/* Content */}
      <motion.div
        style={{ opacity: contentOpacity, y: contentY }}
        className="relative z-10 flex h-full flex-col justify-end px-6 pb-24 md:px-10 lg:px-14"
      >
        <div className="mx-auto w-full max-w-[110rem]">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="text-eyebrow mb-6 flex items-center gap-2 text-gold"
          >
            <MapPin className="h-3.5 w-3.5" />
            {data.eyebrow}
          </motion.p>

          <TextReveal
            as="h1"
            text={data.heading}
            className="text-display-xl max-w-5xl text-ivory"
            delay={0.8}
          />

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="mt-7 max-w-xl text-lg leading-relaxed text-ivory/70"
          >
            {data.subheading}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.6, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="mt-10 flex flex-wrap items-center gap-4"
          >
            {data.primaryCtaLabel && (
              <Magnetic>
                <ButtonLink href={data.primaryCtaHref || "/book-visit"} variant="gold" size="lg">
                  {data.primaryCtaLabel}
                  <ArrowUpRight className="h-5 w-5 transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </ButtonLink>
              </Magnetic>
            )}
            {data.secondaryCtaLabel && (
              <Magnetic>
                <ButtonLink href={data.secondaryCtaHref || "/products"} variant="outline-light" size="lg">
                  {data.secondaryCtaLabel}
                </ButtonLink>
              </Magnetic>
            )}
          </motion.div>
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.2, duration: 1 }}
        className="absolute bottom-8 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-3 md:flex"
        aria-hidden
      >
        <span className="text-[0.65rem] uppercase tracking-[0.35em] text-ivory/50">Scroll</span>
        <span className="flex h-9 w-5.5 items-start justify-center rounded-full border border-ivory/30 p-1.5">
          <span className="h-2 w-[3px] rounded-full bg-gold animate-scroll-hint" />
        </span>
      </motion.div>
    </section>
  );
}
