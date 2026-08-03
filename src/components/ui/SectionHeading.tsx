import { cn } from "@/lib/utils";
import { Reveal } from "@/components/motion/Reveal";
import { TextReveal } from "@/components/motion/TextReveal";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  /**
   * Render for a dark ground. Prestige 2.0 is dark throughout, so new work
   * should always pass this.
   *
   * It still defaults to `false` because the unmigrated light pages rely on
   * that default — flipping it turns their headings white-on-white. The prop
   * disappears once the last light page is gone.
   */
  dark?: boolean;
  /** Display size. `md` is the legacy default; `lg` is the 2.0 section scale. */
  size?: "md" | "lg";
  className?: string;
}

/** Editorial section header: gold eyebrow, cinematic title reveal, muted lede. */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  dark = false,
  size = "md",
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "max-w-3xl",
        align === "center" && "mx-auto text-center",
        className
      )}
    >
      {eyebrow && (
        <Reveal direction="none" duration={0.7}>
          <p className={cn("text-eyebrow mb-5", dark ? "text-gold" : "text-gold")}>
            {eyebrow}
          </p>
        </Reveal>
      )}
      <TextReveal
        text={title}
        className={cn(
          size === "lg" ? "text-h2" : "text-display-md",
          dark ? "text-text" : "text-ink"
        )}
      />
      {description && (
        <Reveal delay={0.25}>
          <p
            className={cn(
              "mt-6 leading-relaxed",
              size === "lg" ? "text-lead" : "text-lg",
              dark ? "text-muted" : "text-slate-warm"
            )}
          >
            {description}
          </p>
        </Reveal>
      )}
    </div>
  );
}
