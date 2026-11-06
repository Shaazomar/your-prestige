import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Official Prestige brand lockup.
 *
 * The supplied logo asset is the "P" monogram only (public/brand/mark.png,
 * brand yellow #FFD900). The "PRESTIGE / TILES & SANITARY" wordmark
 * and tagline are typeset here to match the official layout, so the lockup
 * stays crisp at any size and can adapt to light/dark surfaces.
 */

export const BRAND = {
  name: "Prestige Tiles & Sanitary",
  wordmark: "PRESTIGE",
  wordmarkSub: "Tiles & Sanitary",
  tagline: "Designing Spaces, Crafting Elegance",
  markSrc: "/brand/mark.png",
  color: "#FFD900",
} as const;

const sizes = {
  xs: { mark: 20, main: "text-[0.72rem]", sub: "text-[0.42rem]" },
  sm: { mark: 26, main: "text-[0.9rem]", sub: "text-[0.48rem]" },
  md: { mark: 34, main: "text-[1.15rem]", sub: "text-[0.55rem]" },
  lg: { mark: 48, main: "text-[1.6rem]", sub: "text-[0.62rem]" },
  xl: { mark: 72, main: "text-[2.4rem]", sub: "text-[0.8rem]" },
} as const;

interface LogoProps {
  /** Rendered scale of the lockup */
  size?: keyof typeof sizes;
  /** Text colour treatment for the surface it sits on */
  tone?: "light" | "dark";
  /** Show only the P monogram (no wordmark) */
  markOnly?: boolean;
  /** Include the tagline beneath the wordmark */
  withTagline?: boolean;
  /** Hide the "Tiles & Sanitary" line, leaving the monogram and PRESTIGE alone. Used by the site nav. */
  hideSub?: boolean;
  /** Stack the mark above the wordmark instead of beside it */
  stacked?: boolean;
  className?: string;
}

export function Logo({
  size = "md",
  tone = "dark",
  markOnly = false,
  withTagline = false,
  hideSub = false,
  stacked = false,
  className,
}: LogoProps) {
  const s = sizes[size];
  const isLight = tone === "light"; // light = light text, for dark backgrounds

  return (
    <span
      className={cn(
        "inline-flex select-none",
        stacked ? "flex-col items-center gap-2" : "flex-row items-center gap-2.5",
        className
      )}
    >
      <Image
        src={BRAND.markSrc}
        alt=""
        width={s.mark}
        height={s.mark}
        priority
        className="shrink-0 object-contain"
        style={{ width: s.mark, height: "auto" }}
      />
      {!markOnly && (
        <span className={cn("flex flex-col leading-none", stacked && "items-center")}>
          <span
            className={cn(
              s.main,
              "font-bold uppercase tracking-[0.18em]",
              isLight ? "text-ivory" : "text-ink"
            )}
          >
            {BRAND.wordmark}
          </span>
          {!hideSub && (
            <span
              className={cn(
                s.sub,
                "mt-1 font-semibold uppercase tracking-[0.3em]",
                // Brand yellow sings on dark; on ivory it needs darkening to stay legible.
                isLight ? "text-[#FFD900]" : "text-[#a88a00]"
              )}
            >
              {BRAND.wordmarkSub}
            </span>
          )}
          {withTagline && (
            <span
              className={cn(
                "serif-accent mt-2 text-[0.72rem] tracking-normal",
                isLight ? "text-ivory/45" : "text-slate-warm"
              )}
            >
              {BRAND.tagline}
            </span>
          )}
        </span>
      )}
    </span>
  );
}

/** Logo wrapped in a link home — the standard header/footer usage. */
export function LogoLink({
  href = "/",
  ariaLabel = `${BRAND.name} — Home`,
  ...props
}: LogoProps & { href?: string; ariaLabel?: string }) {
  return (
    <Link href={href} aria-label={ariaLabel} className="inline-flex">
      <Logo {...props} />
    </Link>
  );
}
