import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { SafeImage } from "./SafeImage";

export type CurvedVariant = "soft" | "architectural" | "asymmetric" | "hero";

/**
 * Asymmetric corner radii, per variant.
 *
 * The point of these is that no two corners match. A uniform `rounded-3xl`
 * reads as a UI card; unequal corners read as a drawn shape, which is what
 * gives the media its architectural quality. Values are in the
 * top-left / top-right / bottom-right / bottom-left order CSS expects.
 */
const RADII: Record<CurvedVariant, string> = {
  /* Barely tempered — for media that sits inside a text column. */
  soft: "rounded-[1.5rem_1.5rem_2rem_1.5rem]",
  /* The workhorse: one strong corner, three quiet ones. */
  architectural: "rounded-[3rem_1.25rem_3rem_1.25rem] md:rounded-[5rem_1.5rem_5rem_1.5rem]",
  /* Every corner different — for standalone editorial images. */
  asymmetric:
    "rounded-[2.5rem_1rem_4rem_1.5rem] md:rounded-[6rem_2rem_9rem_2.5rem]",
  /* Hero scale. Deliberately extreme at the bottom-right so the shape
     flows out of the viewport rather than terminating in it. */
  hero: "rounded-[3rem_2rem_5rem_2rem] md:rounded-[7rem_3rem_12rem_3rem]",
};

interface CurvedMediaProps {
  src?: string | null;
  alt: string;
  variant?: CurvedVariant;
  /** CSS aspect-ratio, e.g. "16/9" or "4/5". Reserves space — prevents CLS. */
  aspectRatio?: string;
  /** Only the LCP image on a page should set this. */
  priority?: boolean;
  /** Scrim for text laid over the media. */
  overlay?: boolean | "strong";
  /** Scale the image slightly on hover. Off by default. */
  zoomOnHover?: boolean;
  sizes?: string;
  className?: string;
  /** Content laid over the media — captions, play buttons, headlines. */
  children?: ReactNode;
}

/**
 * The single curved media frame used across the site — hero, split sections,
 * collection headers, editorial breaks.
 *
 * Space is always reserved via `aspect-ratio`, so nothing below the image
 * shifts when it decodes.
 */
export function CurvedMedia({
  src,
  alt,
  variant = "architectural",
  aspectRatio = "4/3",
  priority = false,
  overlay = false,
  zoomOnHover = false,
  sizes = "(max-width: 768px) 100vw, (max-width: 1280px) 60vw, 50vw",
  className,
  children,
}: CurvedMediaProps) {
  return (
    <div
      className={cn(
        "group/media relative isolate overflow-hidden bg-stone-100",
        RADII[variant],
        className
      )}
      style={{ aspectRatio }}
    >
      <SafeImage
        src={src || ""}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        className={cn(
          "object-cover object-center",
          zoomOnHover &&
            "transition-transform duration-[1.2s] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/media:scale-[1.04]"
        )}
        lightSkeleton
      />

      {overlay && (
        <div
          aria-hidden
          className={cn(
            "absolute inset-0",
            overlay === "strong"
              ? "bg-gradient-to-t from-black/70 via-black/25 to-black/10"
              : "bg-gradient-to-t from-black/45 via-black/5 to-transparent"
          )}
        />
      )}

      {children && <div className="absolute inset-0">{children}</div>}
    </div>
  );
}
