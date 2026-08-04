"use client";

import { motion } from "framer-motion";
import { Square } from "lucide-react";
import { cn } from "@/lib/utils";

interface SizeChipProps {
  size: string;
  dark?: boolean;
  index?: number;
  className?: string;
}

/** Floating pill chip for a tile/product dimension — never plain text. */
export function SizeChip({ size, dark = false, index = 0, className }: SizeChipProps) {
  return (
    <motion.span
      initial={{ opacity: 0, y: 6 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium tracking-wide shadow-soft transition-all duration-300 hover:-translate-y-0.5",
        dark
          ? "border-gold/30 bg-ivory/5 text-ivory hover:border-gold"
          : "border-gold/25 bg-white text-ink hover:border-gold hover:shadow-gold",
        className
      )}
    >
      <Square className="h-2.5 w-2.5 text-gold" strokeWidth={2.5} />
      {size}
    </motion.span>
  );
}
