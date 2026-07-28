import { cn } from "@/lib/utils";

/** Premium wordmark badge standing in for a brand logo asset. */
export function BrandMark({ brand, dark = false, className }: { brand: string; dark?: boolean; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em]",
        dark ? "border-ivory/20 text-ivory/90" : "border-ink/10 bg-white/90 text-ink",
        className
      )}
    >
      {brand}
    </span>
  );
}
