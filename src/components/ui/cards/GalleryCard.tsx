"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { Expand } from "lucide-react";

export interface GalleryCardProps {
  image: string;
  alt?: string | null;
  blurDataURL?: string;
  /** Drives the masonry rhythm — the gallery alternates these down the page. */
  ratio?: "tall" | "wide" | "square" | "portrait";
  caption?: string | null;
  onOpen?: () => void;
  priority?: boolean;
  sizes?: string;
  className?: string;
}

const RATIO = {
  tall: "aspect-[3/4]",
  portrait: "aspect-[4/5]",
  wide: "aspect-[16/10]",
  square: "aspect-square",
} as const;

/**
 * Image only. Everything else arrives on hover.
 *
 * Rendered as a real <button> so the lightbox is keyboard-reachable —
 * a div with onClick is the usual mistake here.
 */
export function GalleryCard({
  image,
  alt,
  blurDataURL,
  ratio = "portrait",
  caption,
  onOpen,
  priority = false,
  sizes = "(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw",
  className,
}: GalleryCardProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={alt ? `View ${alt}` : "View image"}
      className={cn(
        "hover-zoom media-frame group block w-full cursor-zoom-in",
        RATIO[ratio],
        className
      )}
    >
      <Image
        src={image}
        alt={alt ?? ""}
        fill
        sizes={sizes}
        priority={priority}
        placeholder={blurDataURL ? "blur" : undefined}
        blurDataURL={blurDataURL}
        className="object-cover"
      />

      <span
        className={cn(
          "absolute inset-0 flex flex-col justify-end bg-canvas/0 p-6 text-left",
          "opacity-0 transition-[opacity,background-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
          "group-hover:bg-canvas/45 group-hover:opacity-100",
          "group-focus-visible:bg-canvas/45 group-focus-visible:opacity-100"
        )}
      >
        <Expand className="mb-auto ml-auto h-5 w-5 text-text" aria-hidden="true" />
        {caption && <span className="text-sm text-text">{caption}</span>}
      </span>
    </button>
  );
}
