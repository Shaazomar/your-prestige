import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  light?: boolean;
}

export function Skeleton({ className, light = false, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-md",
        light ? "skeleton-light" : "skeleton",
        className
      )}
      {...props}
    />
  );
}

export function SkeletonText({ lines = 3, light = false, className }: { lines?: number; light?: boolean; className?: string }) {
  return (
    <div className={cn("space-y-2.5", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          light={light}
          className={cn(
            "h-3.5 w-full",
            i === lines - 1 && "w-3/4" // last line slightly shorter
          )}
        />
      ))}
    </div>
  );
}

export function SkeletonImage({ className, light = false }: SkeletonProps) {
  return <Skeleton className={cn("aspect-[4/5] w-full rounded-2xl", className)} light={light} />;
}

/**
 * Mirrors ProductCard exactly: 4:5 image, then brand / name / size / meta
 * hanging beneath it with no surrounding panel. If the card changes shape,
 * this has to change with it — a skeleton that settles into a different
 * layout is worse than no skeleton at all.
 */
export function SkeletonProductCard({ light = true }: { light?: boolean }) {
  return (
    <div className="flex flex-col">
      <Skeleton light={light} className="aspect-[4/5] w-full rounded-[1.25rem]" />
      <div className="pt-4">
        <Skeleton light={light} className="h-2.5 w-16 rounded-full" />
        <Skeleton light={light} className="mt-2.5 h-3.5 w-3/4 rounded-full" />
        <Skeleton light={light} className="mt-2 h-3 w-1/2 rounded-full" />
        <Skeleton light={light} className="mt-1.5 h-2.5 w-2/5 rounded-full" />
      </div>
    </div>
  );
}

export function SkeletonProductGrid({ count = 8, light = true }: { count?: number; light?: boolean }) {
  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 md:gap-x-6 xl:grid-cols-4 xl:gap-x-8">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonProductCard key={i} light={light} />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4, light = false }: { rows?: number; cols?: number; light?: boolean }) {
  return (
    <div className="w-full space-y-3.5">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 items-center py-2.5 border-b border-white/5">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton
              key={c}
              light={light}
              className={cn(
                "h-4 flex-1",
                c === 0 && "flex-2",
                c === cols - 1 && "w-12 flex-none"
              )}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonForm({ fields = 4, light = false }: { fields?: number; light?: boolean }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton light={light} className="h-3 w-1/4" />
          <Skeleton light={light} className="h-10 w-full rounded-xl" />
        </div>
      ))}
      <Skeleton light={light} className="h-12 w-32 rounded-full mt-4" />
    </div>
  );
}
