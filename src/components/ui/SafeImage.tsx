"use client";

import { useState } from "react";
import Image, { type ImageProps } from "next/image";
import { cn } from "@/lib/utils";
import { Skeleton } from "./Skeleton";
import { ImageOff } from "lucide-react";

interface SafeImageProps extends Omit<ImageProps, "onLoad" | "onError"> {
  lightSkeleton?: boolean;
}

export function SafeImage({
  src,
  alt,
  className,
  lightSkeleton = false,
  ...props
}: SafeImageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  if (error || !src) {
    return (
      <div className={cn("flex items-center justify-center bg-stone-100 text-stone-400 p-4 rounded-xl", className)}>
        <ImageOff className="h-6 w-6 stroke-1" />
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden w-full h-full">
      {loading && (
        <Skeleton
          light={lightSkeleton}
          className="absolute inset-0 z-10 w-full h-full rounded-none"
        />
      )}
      <Image
        src={src}
        alt={alt || "Prestige Tiles image"}
        className={cn(
          "transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
          loading ? "scale-98 opacity-0 blur-xs" : "scale-100 opacity-100 blur-none",
          className
        )}
        onLoad={() => setLoading(false)}
        onError={() => setError(true)}
        {...props}
      />
    </div>
  );
}
