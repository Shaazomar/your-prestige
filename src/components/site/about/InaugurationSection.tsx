"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import type { AboutPerson } from "@prisma/client";

interface InaugurationSectionProps {
  inauguration?: AboutPerson | null;
}

export function InaugurationSection({ inauguration }: InaugurationSectionProps) {
  // If disabled or missing, don't render section
  if (!inauguration || !inauguration.active) return null;

  const eyebrow = inauguration.eyebrow || "INAUGURATED BY";
  const name = inauguration.name || "U. T. Khader";
  const designation =
    inauguration.designation ||
    "Minister of Health and Family Welfare of Karnataka";
  const imageAlt =
    inauguration.imageAlt || `${name} - ${designation}`;

  // Only render description if it doesn't duplicate the designation
  const showDescription =
    inauguration.description &&
    inauguration.description.trim().toLowerCase() !== designation.trim().toLowerCase() &&
    !inauguration.description.includes(designation);

  return (
    <section className="relative bg-[#faf9f6] py-20 md:py-32 border-y border-stone-200/70">
      <Container size="wide">
        <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-16">
          {/* Left Column: Large Editorial Photograph (58% width on desktop) */}
          <div className="lg:col-span-7">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="relative aspect-[16/11] md:aspect-[16/10] w-full overflow-hidden rounded-2xl bg-stone-100 border border-stone-200/80 shadow-[0_16px_50px_rgba(0,0,0,0.06)]"
            >
              <Image
                src={inauguration.image}
                alt={imageAlt}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 58vw"
                className="object-cover object-center"
                unoptimized={inauguration.image.startsWith("/uploads")}
              />
            </motion.div>
          </div>

          {/* Right Column: Architectural Typography Column (42% width on desktop) */}
          <div className="lg:col-span-5 space-y-5 lg:pl-2">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-amber-800/80">
                {eyebrow}
              </span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-4xl font-serif font-bold text-stone-900 sm:text-5xl md:text-6xl tracking-tight leading-[1.08]"
            >
              {name}
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="text-base sm:text-lg md:text-xl font-sans font-normal text-stone-600 leading-relaxed max-w-lg"
            >
              {designation}
            </motion.p>

            {showDescription && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-sm md:text-base leading-relaxed text-stone-500 pt-2"
              >
                {inauguration.description}
              </motion.p>
            )}

            {(inauguration.date || inauguration.location) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="pt-6 mt-6 border-t border-stone-200/60 flex flex-wrap items-center gap-6 text-xs uppercase tracking-widest font-mono text-stone-400"
              >
                {inauguration.date && <span>Date: {inauguration.date}</span>}
                {inauguration.location && <span>Location: {inauguration.location}</span>}
              </motion.div>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}
