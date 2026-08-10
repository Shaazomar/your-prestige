"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface OrganicVideoShapeProps {
  posterImage: string;
  videoSrc?: string;
  children?: React.ReactNode;
}

export function OrganicVideoShape({
  posterImage,
  videoSrc,
  children,
}: OrganicVideoShapeProps) {
  const [videoReady, setVideoReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && videoRef.current.readyState >= 3) {
      setVideoReady(true);
    }
  }, []);

  // Default architectural ambient video fallback if no video URL provided
  const activeVideo =
    videoSrc ||
    "https://assets.mixkit.co/videos/preview/mixkit-modern-architecture-of-a-building-41561-large.mp4";

  return (
    <div className="relative w-full h-full group">
      {/* SVG Clip Path Definition (Normalized 0..1 bounding box) */}
      <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
        <defs>
          <clipPath id="hero-organic-clip" clipPathUnits="objectBoundingBox">
            <path d="M 0.35,0 C 0.12,0 0,0.12 0,0.30 C 0,0.56 0.04,0.72 0.01,0.88 C 0.01,0.96 0.10,1 0.22,1 L 0.65,1 C 0.85,1 1,0.85 1,0.65 L 1,0.22 C 1,0.06 0.85,0 0.68,0 Z" />
          </clipPath>
        </defs>
      </svg>

      {/* Outer Prestige Gold Organic Border Outline (#F6C600) with Offset */}
      <div className="absolute -inset-2.5 pointer-events-none z-10">
        <motion.svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="w-full h-full overflow-visible"
          animate={{ opacity: [0.65, 0.9, 0.65] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        >
          <path
            d="M 35,0.5 C 12,0.5 0.5,12 0.5,30 C 0.5,56 4,72 1.3,88 C 1.3,96 10,99.5 22,99.5 L 65,99.5 C 85,99.5 99.5,85 99.5,65 L 99.5,22 C 99.5,6 85,0.5 68,0.5 Z"
            fill="none"
            stroke="#F6C600"
            strokeWidth="1.2"
            strokeLinecap="round"
            className="transition-opacity duration-500 group-hover:opacity-100"
          />
        </motion.svg>
      </div>

      {/* Layered Architectural Shadow & Organic Clipped Video Wrapper */}
      <div
        className="relative w-full h-full shadow-[0_25px_70px_rgba(0,0,0,0.14),0_10px_30px_rgba(0,0,0,0.08)] transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.015]"
        style={{
          clipPath: "url(#hero-organic-clip)",
          WebkitClipPath: "url(#hero-organic-clip)",
        }}
      >
        {/* Poster Image (shown immediately before video loads) */}
        <Image
          src={posterImage}
          alt="Luxury architectural tile showroom preview"
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          className={cn(
            "object-cover object-center transition-opacity duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
            videoReady ? "opacity-0" : "opacity-100"
          )}
        />

        {/* Video Source */}
        <video
          ref={videoRef}
          src={activeVideo}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          onCanPlay={() => setVideoReady(true)}
          onLoadedData={() => setVideoReady(true)}
          className={cn(
            "absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
            videoReady ? "opacity-100" : "opacity-0"
          )}
        />

        {/* Subtle Dark Gradient Overlay for Control Legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 pointer-events-none" />

        {/* Slot for Play Button or Overlay UI */}
        {children}
      </div>
    </div>
  );
}
