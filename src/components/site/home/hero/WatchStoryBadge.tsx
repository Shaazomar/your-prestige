"use client";

import { Play } from "lucide-react";
import { motion } from "framer-motion";

interface WatchStoryBadgeProps {
  onClick: () => void;
}

export function WatchStoryBadge({ onClick }: WatchStoryBadgeProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label="Watch Story 1:25 min"
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      className="group absolute -bottom-4 left-6 sm:left-10 z-30 flex items-center gap-3 rounded-full bg-ink/95 px-6 py-3.5 text-xs font-bold text-ivory shadow-[0_16px_48px_rgba(0,0,0,0.35)] backdrop-blur-md border border-white/10 transition-all duration-300 hover:bg-ink hover:border-[#F6C600]/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F6C600]"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F6C600] text-ink shadow-sm transition-transform duration-300 group-hover:scale-110">
        <Play className="h-3.5 w-3.5 fill-ink ml-0.5" />
      </span>
      <div className="text-left leading-tight">
        <span className="block font-serif font-bold tracking-tight text-white group-hover:text-[#F6C600] transition-colors">Watch Story</span>
        <span className="block text-[10px] text-stone-400 font-normal">1:25 min</span>
      </div>
    </motion.button>
  );
}
