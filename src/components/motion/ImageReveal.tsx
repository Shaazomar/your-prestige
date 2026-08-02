"use client";

import { motion } from "framer-motion";
import Image, { type ImageProps } from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ImageRevealProps extends ImageProps {
  wrapperClassName?: string;
  hoverZoom?: boolean;
}

export function ImageReveal({
  src,
  alt,
  className,
  wrapperClassName,
  hoverZoom = true,
  ...props
}: ImageRevealProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, filter: "blur(14px)", scale: 0.96 }}
      whileInView={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.95, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "relative overflow-hidden will-change-[transform,opacity,filter]",
        wrapperClassName
      )}
    >
      <Image
        src={src}
        alt={alt}
        onLoad={() => setIsLoaded(true)}
        className={cn(
          "transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
          isLoaded ? "opacity-100 scale-100" : "opacity-0 scale-105 blur-md",
          hoverZoom && "group-hover:scale-106",
          className
        )}
        {...props}
      />
    </motion.div>
  );
}
