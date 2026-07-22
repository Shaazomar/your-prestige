import { cn } from "@/lib/utils";
import { Reveal } from "@/components/motion/Reveal";
import { TextReveal } from "@/components/motion/TextReveal";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  dark?: boolean;
  className?: string;
}

/** Editorial section header: gold eyebrow, cinematic title reveal, muted lede. */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  dark = false,
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
          <p className="text-eyebrow mb-5 text-gold">{eyebrow}</p>
        </Reveal>
      )}
      <TextReveal
        text={title}
        className={cn("text-display-md", dark ? "text-ivory" : "text-ink")}
      />
      {description && (
        <Reveal delay={0.25}>
          <p
            className={cn(
              "mt-6 text-lg leading-relaxed",
              dark ? "text-stone-300" : "text-slate-warm"
            )}
          >
            {description}
          </p>
        </Reveal>
      )}
    </div>
  );
}
