"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface FilterChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  /** Scopes the shared active-pill animation to its own filter row */
  group: string;
}

export function FilterChip({ label, active, onClick, icon, group }: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-300",
        active
          ? "border-ink text-ivory"
          : "border-ink/12 text-slate-warm hover:border-ink/30 hover:text-ink"
      )}
    >
      {active && (
        <motion.span
          layoutId={`filter-chip-active-${group}`}
          className="absolute inset-0 rounded-full bg-ink"
          transition={{ type: "spring", damping: 24, stiffness: 260 }}
        />
      )}
      <span className="relative z-10 flex items-center gap-1.5">
        {icon}
        {label}
      </span>
    </button>
  );
}
