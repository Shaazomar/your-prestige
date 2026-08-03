import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CollectionCardProps {
  href: string;
  name: string;
  /** Tiny tracked-out label above the name — e.g. "Marble" or "12 finishes". */
  label?: string;
  image: string;
  blurDataURL?: string;
  /** Editorial cards alternate tall/wide down the page. */
  ratio?: "tall" | "wide" | "square";
  /** True for the first card in the viewport, so the LCP image is eager. */
  priority?: boolean;
  sizes?: string;
  className?: string;
}

const RATIO = {
  tall: "aspect-[3/4]",
  wide: "aspect-[16/10]",
  square: "aspect-square",
} as const;

/**
 * Large image, tiny label, name, arrow. Zoom + scrim deepen on hover.
 * The whole card is one link — no nested interactive elements.
 */
export function CollectionCard({
  href,
  name,
  label,
  image,
  blurDataURL,
  ratio = "tall",
  priority = false,
  sizes = "(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw",
  className,
}: CollectionCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "hover-zoom media-frame media-scrim group block",
        RATIO[ratio],
        className
      )}
    >
      <Image
        src={image}
        alt=""
        fill
        sizes={sizes}
        priority={priority}
        placeholder={blurDataURL ? "blur" : undefined}
        blurDataURL={blurDataURL}
        className="object-cover"
      />

      <div className="scrim-content absolute inset-x-0 bottom-0 flex items-end justify-between gap-6 p-7 md:p-8">
        <div className="min-w-0">
          {label && <p className="text-eyebrow mb-3 text-gold">{label}</p>}
          <h3 className="text-h4 text-text">{name}</h3>
        </div>

        <span
          className={cn(
            "grid h-11 w-11 shrink-0 place-items-center rounded-full",
            "border border-line-strong text-text",
            "transition-[background-color,border-color,color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
            "group-hover:border-gold group-hover:bg-gold group-hover:text-canvas"
          )}
          aria-hidden="true"
        >
          <ArrowUpRight className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}
