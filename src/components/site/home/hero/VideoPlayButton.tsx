"use client";

import { Play } from "lucide-react";
import { motion } from "framer-motion";

interface VideoPlayButtonProps {
  onClick: () => void;
}

export function VideoPlayButton({ onClick }: VideoPlayButtonProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label="Play story"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      className="group relative z-20 flex h-24 w-24 items-center justify-center rounded-full p-0 text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
    >
      {/* Backdrop blur glass background */}
      <div className="absolute inset-0 rounded-full bg-ink/75 backdrop-blur-md border border-white/10 transition-all duration-300 group-hover:bg-ink/90 group-hover:border-[#F6C600]/30 shadow-[0_12px_40px_rgba(0,0,0,0.3)]" />

      {/* Rotating Text Circle */}
      <div className="absolute inset-2 select-none pointer-events-none animate-[spin_20s_linear_infinite] opacity-80 group-hover:opacity-100 transition-opacity">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path
            id="playCirclePath"
            d="M 50,50 m -37,0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0"
            fill="none"
          />
          <text className="font-serif text-[7.5px] uppercase tracking-[0.22em] fill-[#F6C600] font-bold">
            <textPath href="#playCirclePath" startOffset="0%">
              • WATCH BRAND STORY • PRESTIGE TILES
            </textPath>
          </text>
        </svg>
      </div>

      {/* Static gold play icon inside the rotating ring */}
      <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full bg-[#F6C600] shadow-md transition-transform duration-300 group-hover:scale-110">
        <Play className="h-4.5 w-4.5 fill-ink text-ink ml-0.5" />
      </div>
    </motion.button>
  );
}
