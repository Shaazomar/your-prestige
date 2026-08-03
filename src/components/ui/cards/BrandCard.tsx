import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface BrandCardProps {
  href: string;
  name: string;
  logo?: string | null;
  className?: string;
}

/**
 * A logo wall tile. Logos arrive in a dozen different colourways, so they sit
 * de-saturated at rest and resolve to full colour on hover — the only way a
 * mixed-brand wall reads as one composition.
 *
 * Falls back to the wordmark when a brand has no logo asset, which is common
 * for newly added rows.
 */
export function BrandCard({ href, name, logo, className }: BrandCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group grid aspect-[3/2] place-items-center rounded-[--radius-card] p-8",
        "border border-line bg-surface/40",
        "transition-[border-color,background-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
        "hover:border-line-strong hover:bg-surface",
        className
      )}
      aria-label={name}
    >
      {logo ? (
        <span className="relative block h-12 w-full">
          <Image
            src={logo}
            alt={name}
            fill
            sizes="(max-width: 768px) 40vw, 20vw"
            className={cn(
              "object-contain opacity-55 grayscale",
              "transition-[opacity,filter] duration-600 ease-[cubic-bezier(0.22,1,0.36,1)]",
              "group-hover:opacity-100 group-hover:grayscale-0"
            )}
          />
        </span>
      ) : (
        <span className="text-center text-lg font-medium tracking-tight text-muted transition-colors duration-500 group-hover:text-text">
          {name}
        </span>
      )}
    </Link>
  );
}
