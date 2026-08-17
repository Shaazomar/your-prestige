"use client";

import { useState } from "react";
import Image, { type ImageProps } from "next/image";
import { cn } from "@/lib/utils";
import { Skeleton } from "./Skeleton";

interface SafeImageProps extends Omit<ImageProps, "onLoad" | "onError"> {
  lightSkeleton?: boolean;
  /** Short label drawn into the placeholder when there is no image. */
  placeholderLabel?: string;
}

/** Stable 0–3 from a string, so a grid of placeholders varies but never flickers. */
function toneOf(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return Math.abs(h) % 4;
}

/* Four warm stone washes. Close enough to read as one system, different
   enough that a grid of image-less products doesn't look like a broken page. */
const PLACEHOLDER_TONES = [
  "from-[#f4f2ec] to-[#e9e6dd]",
  "from-[#f2f0e9] to-[#e6e2d7]",
  "from-[#f5f3ee] to-[#eae7de]",
  "from-[#f0eee7] to-[#e4e0d5]",
];

/**
 * Every image on the public site goes through here.
 *
 * The no-image case is a designed state, not an error state. Most of the
 * imported catalogue has no photography yet, so a missing image has to look
 * like an intentional material swatch — never a broken-image glyph, which
 * would read as a site fault on the majority of product cards.
 */
export function SafeImage({
  src,
  alt,
  className,
  lightSkeleton = false,
  placeholderLabel,
  fill,
  ...props
}: SafeImageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  if (error || !src) {
    const tone = PLACEHOLDER_TONES[toneOf(String(alt || placeholderLabel || "prestige"))];
    return (
      <div
        role="img"
        aria-label={alt ? `${alt} — image coming soon` : "Image coming soon"}
        className={cn(
          "flex h-full w-full flex-col items-center justify-center gap-3",
          "bg-gradient-to-br",
          tone,
          fill && "absolute inset-0",
          className
        )}
      >
        {/* Quiet monogram — brand presence without shouting placeholder. */}
        <svg
          viewBox="0 0 48 48"
          className="h-8 w-8 text-[#181818]/12"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M8 40V8h16a10 10 0 0 1 0 20H16"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="square"
          />
        </svg>
        {placeholderLabel && (
          <span className="px-3 text-center text-[10px] font-medium uppercase tracking-[0.18em] text-[#181818]/25">
            {placeholderLabel}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={cn("relative h-full w-full overflow-hidden", fill && "absolute inset-0")}>
      {loading && (
        <Skeleton
          light={lightSkeleton}
          className="absolute inset-0 z-10 h-full w-full rounded-none"
        />
      )}
      <Image
        src={src}
        alt={alt || ""}
        fill={fill}
        className={cn(
          "transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
          loading ? "scale-[0.98] opacity-0 blur-sm" : "scale-100 opacity-100 blur-none",
          className
        )}
        onLoad={() => setLoading(false)}
        onError={() => setError(true)}
        {...props}
      />
    </div>
  );
}
