"use client";

import React, { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import "./TiltedCard.css";

/**
 * A quiet, on-brand placeholder — the same failure mode `SafeImage` shows
 * everywhere else, so a broken About-page photo doesn't stand out as a
 * different kind of bug from a broken product photo. `TiltedCard` predates
 * `SafeImage` and is built around a plain `<img>` driven by CSS transforms
 * (the 3D tilt), not `next/image`'s `fill` layout, so it gets its own small
 * error state rather than being forced into `SafeImage`'s shape.
 */
function TiltedCardFallback({ label }: { label?: string }) {
  return (
    <div
      role="img"
      aria-label={label ? `${label} — image unavailable` : "Image unavailable"}
      className="tilted-card-image flex h-full w-full items-center justify-center bg-gradient-to-br from-[#f4f2ec] to-[#e9e6dd]"
    >
      <svg viewBox="0 0 48 48" className="h-8 w-8 text-[#181818]/12" fill="none" aria-hidden="true">
        <path d="M8 40V8h16a10 10 0 0 1 0 20H16" stroke="currentColor" strokeWidth="3" strokeLinecap="square" />
      </svg>
    </div>
  );
}

export interface TiltedCardProps {
  imageSrc: string | null;
  altText?: string;
  captionText?: string;
  containerHeight?: string;
  containerWidth?: string;
  imageHeight?: string;
  imageWidth?: string;
  scaleOnHover?: number;
  rotateAmplitude?: number;
  showMobileWarning?: boolean;
  showTooltip?: boolean;
  displayOverlayContent?: boolean;
  overlayContent?: React.ReactNode;
  className?: string;
}

export function TiltedCard({
  imageSrc,
  altText = "Card image",
  captionText,
  containerHeight = "420px",
  containerWidth = "100%",
  imageHeight = "380px",
  imageWidth = "100%",
  scaleOnHover = 1.04,
  rotateAmplitude = 8,
  displayOverlayContent = true,
  overlayContent,
  className = "",
}: TiltedCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });

  const rotateX = useTransform(
    mouseYSpring,
    [-0.5, 0.5],
    [rotateAmplitude, -rotateAmplitude]
  );
  const rotateY = useTransform(
    mouseXSpring,
    [-0.5, 0.5],
    [-rotateAmplitude, rotateAmplitude]
  );

  const [isHovered, setIsHovered] = useState(false);
  const [failed, setFailed] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const mouseX = (e.clientX - rect.left) / width - 0.5;
    const mouseY = (e.clientY - rect.top) / height - 0.5;

    x.set(mouseX);
    y.set(mouseY);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };

  return (
    <div
      ref={ref}
      className={`tilted-card-container ${className}`}
      style={{
        height: containerHeight,
        width: containerWidth,
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        className="tilted-card-inner shadow-lg border border-stone-200/60 bg-stone-100"
        style={{
          height: imageHeight,
          width: imageWidth,
          rotateX: isHovered ? rotateX : 0,
          rotateY: isHovered ? rotateY : 0,
        }}
        animate={{
          scale: isHovered ? scaleOnHover : 1,
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 25,
        }}
      >
        {failed || !imageSrc ? (
          <TiltedCardFallback label={altText} />
        ) : (
          <img
            src={imageSrc}
            alt={altText}
            className="tilted-card-image"
            loading="lazy"
            onError={() => {
              if (process.env.NODE_ENV !== "production") {
                console.error(`TiltedCard: image failed to load — ${imageSrc}`);
              }
              setFailed(true);
            }}
          />
        )}

        {displayOverlayContent && overlayContent && (
          <div className="tilted-card-overlay">{overlayContent}</div>
        )}

        {captionText && !displayOverlayContent && (
          <p className="tilted-card-caption">{captionText}</p>
        )}
      </motion.div>
    </div>
  );
}

export default TiltedCard;
