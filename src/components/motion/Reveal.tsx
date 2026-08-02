"use client";

import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const directions = {
  up: { y: 40, x: 0 },
  down: { y: -40, x: 0 },
  left: { x: 40, y: 0 },
  right: { x: -40, y: 0 },
  blur: { y: 20, x: 0, filter: "blur(12px)" },
  scale: { scale: 0.94, y: 20, filter: "blur(8px)" },
  none: { x: 0, y: 0 },
} as const;

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  direction?: keyof typeof directions;
  once?: boolean;
}

/** Scroll-triggered reveal with a luxury ease (Apple & Stripe inspired). */
export function Reveal({
  children,
  className,
  delay = 0,
  duration = 1.0,
  direction = "blur",
  once = true,
}: RevealProps) {
  const offset = directions[direction];
  const variants: Variants = {
    hidden: { opacity: 0, ...offset },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      filter: "blur(0px)",
      transition: {
        duration,
        delay,
        ease: [0.16, 1, 0.3, 1], // Smooth Apple-style cubic-bezier
      },
    },
  };

  return (
    <motion.div
      className={cn("will-change-[transform,opacity,filter]", className)}
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: "-60px" }}
    >
      {children}
    </motion.div>
  );
}


/** Staggered children reveal — wrap a list, each child animates in sequence. */
export function RevealStagger({
  children,
  className,
  stagger = 0.1,
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
}) {
  return (
    <motion.div
      className={cn(className)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: stagger } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function RevealItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={cn("will-change-[transform,opacity,filter]", className)}
      variants={{
        hidden: { opacity: 0, y: 30, filter: "blur(10px)" },
        visible: {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          transition: { duration: 0.85, ease: [0.16, 1, 0.3, 1] },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

