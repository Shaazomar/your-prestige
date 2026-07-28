import {
  Sofa, BedDouble, ShowerHead, ChefHat, TreePine, Building2,
  Hotel, Home, Briefcase, UtensilsCrossed, Cross,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Application } from "@/lib/catalog";

export const applicationIcons: Record<Application, typeof Sofa> = {
  "Living Room": Sofa,
  Bedroom: BedDouble,
  Bathroom: ShowerHead,
  Kitchen: ChefHat,
  Outdoor: TreePine,
  Commercial: Building2,
  Hotel: Hotel,
  Villa: Home,
  Office: Briefcase,
  Restaurant: UtensilsCrossed,
  Hospital: Cross,
};

interface ApplicationBadgeProps {
  application: Application;
  size?: "sm" | "md";
  dark?: boolean;
  className?: string;
}

/** Elegant icon chip identifying a room / space application. */
export function ApplicationBadge({
  application,
  size = "md",
  dark = false,
  className,
}: ApplicationBadgeProps) {
  const Icon = applicationIcons[application];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium transition-colors duration-300",
        size === "sm" ? "px-2.5 py-1 text-[0.65rem]" : "px-3.5 py-1.5 text-xs",
        dark
          ? "border-ivory/15 bg-ivory/5 text-ivory/80"
          : "border-ink/10 bg-white/80 text-slate-warm",
        className
      )}
    >
      <Icon className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
      {application}
    </span>
  );
}
