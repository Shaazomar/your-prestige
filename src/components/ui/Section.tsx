import { cn } from "@/lib/utils";
import type { ElementType, ReactNode } from "react";
import { Container } from "./Container";

type Tone = "canvas" | "secondary" | "surface" | "inverse" | "none";
type Space = "default" | "compact" | "flush";

const TONES: Record<Tone, string> = {
  canvas: "bg-canvas text-text",
  /* The alternating band. Used to separate two content sections without
     drawing a line between them. */
  secondary: "bg-secondary text-text",
  surface: "bg-surface text-text",
  /* Near-black band for editorial breaks and the footer. */
  inverse: "bg-[#141412] text-white",
  none: "",
};

const SPACING: Record<Space, string> = {
  /* ~88px mobile → ~140px desktop. Major storytelling sections. */
  default: "py-[clamp(4.5rem,9vw,8.75rem)]",
  /* ~64px mobile → ~96px desktop. Supporting rows, related products. */
  compact: "py-[clamp(4rem,6vw,6rem)]",
  flush: "",
};

interface SectionProps {
  children: ReactNode;
  className?: string;
  as?: ElementType;
  tone?: Tone;
  space?: Space;
  /** Skip the Container — for sections that manage their own full-bleed layout. */
  bleed?: boolean;
  containerSize?: "default" | "wide" | "narrow";
  id?: string;
}

/**
 * Vertical rhythm for the public site.
 *
 * Every major band on a page should be a `<Section>`. Two rules keep the
 * page from turning into an accordion of identical slabs: spacing comes
 * only from `space`, and adjacent sections should not repeat the same
 * `tone` — the alternation is what gives the page structure without
 * needing dividers.
 */
export function Section({
  children,
  className,
  as: Tag = "section",
  tone = "canvas",
  space = "default",
  bleed = false,
  containerSize = "default",
  id,
}: SectionProps) {
  return (
    <Tag id={id} className={cn("relative", TONES[tone], SPACING[space], className)}>
      {bleed ? children : <Container size={containerSize}>{children}</Container>}
    </Tag>
  );
}
