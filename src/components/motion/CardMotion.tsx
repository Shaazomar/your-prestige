"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CardMotionProps {
  children: ReactNode;
  className?: string;
  lift?: number;
  delay?: number;
}

/** Luxury Card container with GPU-accelerated lift, border highlight, and shadow elevation */
export function CardMotion({
  children,
  className,
  lift = -8,
  delay = 0,
}: CardMotionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{
        y: lift,
        transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
      }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-stone-200 bg-white p-6 shadow-soft transition-all duration-300 hover:border-accent hover:shadow-float will-change-[transform,opacity,filter]",
        className
      )}
    >
      {/* Subtle Yellow Ambient Accent Line */}
      <div className="absolute inset-x-0 top-0 h-[2px] w-full bg-accent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      {children}
    </motion.div>
  );
}
