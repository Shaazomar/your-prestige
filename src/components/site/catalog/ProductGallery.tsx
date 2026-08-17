"use client";

import { useState, useEffect, useCallback } from "react";
import { SafeImage } from "@/components/ui/SafeImage";
import { cn } from "@/lib/utils";
import {
  Expand,
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

interface ProductGalleryProps {
  mainImage: string;
  textureImage?: string;
  galleryImages?: string[];
  productName: string;
  brand: string;
  tag?: string;
  className?: string;
}

export function ProductGallery({
  mainImage,
  textureImage,
  galleryImages = [],
  productName,
  brand,
  tag,
  className,
}: ProductGalleryProps) {
  // Combine all images cleanly without duplicates
  const allImages = Array.from(
    new Set([mainImage, textureImage, ...galleryImages].filter(Boolean) as string[])
  );

  const [activeIndex, setActiveIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const reducedMotion = useReducedMotion();
  const activeImage = allImages[activeIndex] || mainImage;

  // Keyboard navigation for lightbox
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isLightboxOpen) return;
      if (e.key === "Escape") {
        setIsLightboxOpen(false);
        setZoomLevel(1);
      } else if (e.key === "ArrowLeft") {
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : allImages.length - 1));
        setZoomLevel(1);
      } else if (e.key === "ArrowRight") {
        setActiveIndex((prev) => (prev < allImages.length - 1 ? prev + 1 : 0));
        setZoomLevel(1);
      }
    },
    [isLightboxOpen, allImages.length]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    if (isLightboxOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [handleKeyDown, isLightboxOpen]);

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;

    if (diff > 50) {
      // Swipe Left -> Next
      setActiveIndex((prev) => (prev < allImages.length - 1 ? prev + 1 : 0));
    } else if (diff < -50) {
      // Swipe Right -> Prev
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : allImages.length - 1));
    }
    setTouchStart(null);
  };

  return (
    <div className={cn("flex flex-col gap-4 lg:gap-6", className)}>
      {/* Primary Gallery Showcase */}
      <div className="group relative w-full">
        {/* Architectural Asymmetric Curved Container */}
        <div
          onClick={() => setIsLightboxOpen(true)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className={cn(
            "relative aspect-[4/3] sm:aspect-[16/11] lg:aspect-[4/3] w-full cursor-zoom-in overflow-hidden",
            "bg-gradient-to-b from-stone-100 to-stone-200/60 shadow-lift transition-all duration-700 ease-luxury",
            // Asymmetric curved corner shape: top-left 36px, top-right 16px, bottom-right 80px, bottom-left 24px
            "rounded-[32px_14px_72px_20px] md:rounded-[40px_18px_96px_28px]",
            "border border-line/40 hover:border-gold/30 hover:shadow-2xl"
          )}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeImage}
              initial={reducedMotion ? false : { opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reducedMotion ? undefined : { opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="relative h-full w-full"
            >
              <SafeImage
                src={activeImage}
                alt={`${productName} surface detail ${activeIndex + 1}`}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 55vw"
                placeholderLabel={brand}
                className="object-cover object-center transition-transform duration-[1200ms] ease-luxury group-hover:scale-[1.03]"
                lightSkeleton
              />
            </motion.div>
          </AnimatePresence>

          {/* Badges Overlay */}
          <div className="pointer-events-none absolute left-4 top-4 z-20 flex flex-wrap gap-2 sm:left-6 sm:top-6">
            {tag && (
              <span className="rounded-full bg-gold/90 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-text shadow-sm backdrop-blur-md">
                {tag}
              </span>
            )}
            {activeIndex === 1 && textureImage && (
              <span className="flex items-center gap-1.5 rounded-full bg-black/65 px-3 py-1 text-[10px] font-medium uppercase tracking-widest text-white backdrop-blur-md">
                <Sparkles className="h-3 w-3 text-gold" />
                Macro Surface Detail
              </span>
            )}
          </div>

          {/* Expand & Zoom Hint Badge */}
          <div className="pointer-events-none absolute right-4 bottom-6 z-20 hidden items-center gap-2 rounded-full bg-black/40 px-3.5 py-1.5 text-xs font-medium text-white/90 backdrop-blur-md transition-all duration-300 group-hover:bg-black/65 md:flex">
            <Expand className="h-3.5 w-3.5 text-gold" />
            <span className="text-[11px] tracking-wide">Click for Fullscreen View</span>
          </div>

          {/* Mobile Carousel Swipe Indicator */}
          {allImages.length > 1 && (
            <div className="pointer-events-none absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/50 px-3 py-1 backdrop-blur-md md:hidden">
              {allImages.map((_, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    idx === activeIndex ? "w-5 bg-gold" : "w-1.5 bg-white/40"
                  )}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Thumbnails Strip */}
      {allImages.length > 1 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-1 pt-1 scrollbar-none">
          {allImages.map((img, index) => {
            const isActive = index === activeIndex;
            return (
              <button
                key={img + index}
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={`View gallery image ${index + 1}`}
                className={cn(
                  "relative h-16 w-20 shrink-0 overflow-hidden rounded-xl transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
                  "border",
                  isActive
                    ? "border-gold shadow-md scale-105"
                    : "border-line/40 opacity-70 hover:opacity-100 hover:border-text/30"
                )}
              >
                <SafeImage
                  src={img}
                  alt={`${productName} thumbnail ${index + 1}`}
                  fill
                  sizes="80px"
                  placeholderLabel={brand}
                  className="object-cover"
                />
                {index === 1 && textureImage && (
                  <div className="absolute inset-x-0 bottom-0 bg-black/60 py-0.5 text-center text-[8px] font-bold tracking-wider text-gold uppercase">
                    Texture
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      <AnimatePresence>
        {isLightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 sm:p-8 backdrop-blur-xl"
          >
            {/* Top Toolbar */}
            <div className="absolute left-4 top-4 right-4 z-50 flex items-center justify-between sm:left-8 sm:top-8 sm:right-8">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-gold">
                  {brand}
                </p>
                <h3 className="font-serif text-lg font-light text-white sm:text-xl">
                  {productName}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => (z >= 2 ? 1 : z + 0.5))}
                  className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                  aria-label="Zoom image"
                >
                  {zoomLevel > 1 ? (
                    <ZoomOut className="h-4 w-4" />
                  ) : (
                    <ZoomIn className="h-4 w-4" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsLightboxOpen(false);
                    setZoomLevel(1);
                  }}
                  className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                  aria-label="Close modal"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Main Lightbox Canvas */}
            <div className="relative flex h-full w-full max-w-6xl items-center justify-center overflow-hidden">
              <motion.div
                animate={{ scale: zoomLevel }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="relative h-[75vh] w-full max-w-4xl"
              >
                <SafeImage
                  src={activeImage}
                  alt={`${productName} fullscreen view`}
                  fill
                  sizes="100vw"
                  className="object-contain"
                  priority
                />
              </motion.div>

              {/* Prev / Next Arrows */}
              {allImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveIndex((prev) => (prev > 0 ? prev - 1 : allImages.length - 1));
                      setZoomLevel(1);
                    }}
                    className="absolute left-2 sm:left-6 z-50 grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white backdrop-blur-md transition-all hover:bg-gold hover:text-black"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveIndex((prev) => (prev < allImages.length - 1 ? prev + 1 : 0));
                      setZoomLevel(1);
                    }}
                    className="absolute right-2 sm:right-6 z-50 grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white backdrop-blur-md transition-all hover:bg-gold hover:text-black"
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}
            </div>

            {/* Bottom Counter & Strip */}
            {allImages.length > 1 && (
              <div className="absolute bottom-6 inset-x-0 z-50 flex flex-col items-center gap-3">
                <span className="text-xs font-mono tracking-widest text-stone-400">
                  {activeIndex + 1} / {allImages.length}
                </span>

                <div className="flex items-center gap-2 max-w-md overflow-x-auto px-4 py-2 bg-black/60 rounded-full backdrop-blur-md">
                  {allImages.map((img, idx) => (
                    <button
                      key={"lightbox-" + img + idx}
                      onClick={() => {
                        setActiveIndex(idx);
                        setZoomLevel(1);
                      }}
                      className={cn(
                        "relative h-10 w-14 shrink-0 overflow-hidden rounded-lg transition-all",
                        idx === activeIndex
                          ? "ring-2 ring-gold opacity-100"
                          : "opacity-40 hover:opacity-80"
                      )}
                    >
                      <SafeImage src={img} alt="" fill sizes="56px" className="object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
