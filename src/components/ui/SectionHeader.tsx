import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/motion/Reveal";
import { TextReveal } from "@/components/motion/TextReveal";

interface SectionHeaderProps {
  /** Two-digit index, e.g. "01". Rendered as `01 / COLLECTIONS`. */
  index?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  action?: { href: string; label: string };
  align?: "left" | "center";
  /** Rendered on the inverse (near-black) band. */
  inverse?: boolean;
  className?: string;
}

/**
 * The house section header: indexed eyebrow, editorial headline, optional
 * lede, and an action that sits on the baseline opposite the title.
 *
 * The indexed eyebrow is what stops a long page reading as an undifferentiated
 * stack — it gives the visitor a sense of position. Use it in document order
 * (01, 02, 03…) within a page rather than per component.
 */
export function SectionHeader({
  index,
  eyebrow,
  title,
  description,
  action,
  align = "left",
  inverse = false,
  className,
}: SectionHeaderProps) {
  const centered = align === "center";

  return (
    <div
      className={cn(
        "flex flex-col gap-8 md:flex-row md:items-end md:justify-between",
        centered && "md:flex-col md:items-center",
        className
      )}
    >
      <div className={cn("max-w-2xl", centered && "mx-auto text-center")}>
        {(index || eyebrow) && (
          <Reveal direction="none" duration={0.7}>
            <p
              className={cn(
                "text-eyebrow mb-5 flex items-center gap-2.5 font-semibold uppercase tracking-[0.2em]",
                centered && "justify-center"
              )}
            >
              {index && (
                <>
                  <span className={inverse ? "text-white/40" : "text-faint"}>{index}</span>
                  <span aria-hidden className={inverse ? "text-white/25" : "text-line-strong"}>
                    /
                  </span>
                </>
              )}
              {eyebrow && <span className="text-gold">{eyebrow}</span>}
            </p>
          </Reveal>
        )}

        <TextReveal
          text={title}
          mode="word"
          className={cn(
            "text-h2 text-balance",
            inverse ? "text-white" : "text-text"
          )}
        />

        {description && (
          <Reveal delay={0.2}>
            <p
              className={cn(
                "mt-5 text-lead text-pretty",
                inverse && "text-white/60"
              )}
            >
              {description}
            </p>
          </Reveal>
        )}
      </div>

      {action && (
        <Reveal delay={0.3} className={cn("shrink-0", centered && "md:mt-2")}>
          <Link
            href={action.href}
            className={cn(
              "group inline-flex items-center gap-2.5 pb-1 text-sm font-medium tracking-tight",
              "border-b transition-colors duration-300",
              inverse
                ? "border-white/20 text-white/80 hover:border-gold hover:text-gold"
                : "border-line-strong text-text hover:border-gold hover:text-gold"
            )}
          >
            {action.label}
            <ArrowRight
              className="h-4 w-4 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-1"
              aria-hidden="true"
            />
          </Link>
        </Reveal>
      )}
    </div>
  );
}
