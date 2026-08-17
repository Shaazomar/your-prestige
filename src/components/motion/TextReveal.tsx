"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";


interface TextRevealProps {
  text: string;
  className?: string;
  delay?: number;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  mode?: "word" | "character" | "blur";
}

/**
 * Premium Text Reveal Component (Apple / Stripe inspired).
 * Modes:
 * - "blur": Smooth blur(12px) + translateY(20px) -> blur(0px) clear transition.
 * - "word": Word-by-word mask rise out of clip bounds.
 * - "character": Character-by-character stagger animation.
 *
 * Under `prefers-reduced-motion` every mode renders the text plainly. The
 * character and word modes in particular split text into dozens of animated
 * spans, which is exactly the sort of thing that triggers vestibular
 * symptoms — so the opt-out short-circuits before any of that is built.
 */
export function TextReveal({
  text,
  className,
  delay = 0,
  as: Tag = "h2",
  mode = "blur",
}: TextRevealProps) {
  const reduced = useReducedMotion();

  if (reduced) {
    return <Tag className={cn(className)}>{text}</Tag>;
  }

  if (mode === "blur") {
    return (
      <Tag className={cn("will-change-[transform,opacity,filter]", className)}>
        <motion.span
          initial={{ opacity: 0, filter: "blur(12px)", y: 20 }}
          whileInView={{ opacity: 1, filter: "blur(0px)", y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{
            duration: 1.0,
            delay,
            ease: [0.16, 1, 0.3, 1], // Apple cubic-bezier
          }}
          className="inline-block"
        >
          {text}
        </motion.span>
      </Tag>
    );
  }

  if (mode === "character") {
    const characters = Array.from(text);
    return (
      <Tag className={cn(className)}>
        <span className="sr-only">{text}</span>
        <motion.span
          aria-hidden
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={{
            visible: { transition: { staggerChildren: 0.02, delayChildren: delay } },
          }}
          className="inline"
        >
          {characters.map((char, i) => (
            <motion.span
              key={i}
              className="inline-block will-change-[transform,opacity,filter]"
              variants={{
                hidden: { opacity: 0, y: 15, filter: "blur(6px)" },
                visible: {
                  opacity: 1,
                  y: 0,
                  filter: "blur(0px)",
                  transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
                },
              }}
            >
              {char === " " ? "\u00A0" : char}
            </motion.span>
          ))}
        </motion.span>
      </Tag>
    );
  }

  // "word" mode
  const words = text.split(" ");
  return (
    <Tag className={cn(className)}>
      <span className="sr-only">{text}</span>
      <motion.span
        aria-hidden
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
        variants={{
          visible: { transition: { staggerChildren: 0.06, delayChildren: delay } },
        }}
        className="inline"
      >
        {words.map((word, i) => (
          <span key={i} className="inline-block overflow-hidden pb-[0.08em] -mb-[0.08em] align-bottom">
            <motion.span
              className="inline-block will-change-[transform,opacity]"
              variants={{
                hidden: { y: "110%", opacity: 0 },
                visible: {
                  y: "0%",
                  opacity: 1,
                  transition: { duration: 0.85, ease: [0.16, 1, 0.3, 1] },
                },
              }}
            >
              {word}
              {i < words.length - 1 ? "\u00A0" : ""}
            </motion.span>
          </span>
        ))}
      </motion.span>
    </Tag>
  );
}
