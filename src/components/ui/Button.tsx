import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, ReactNode } from "react";

/**
 * Prestige 2.0 button system.
 *
 * Four variants, no more. Gold is reserved for `primary` — the single
 * highest-intent action on a screen. If two gold buttons are visible at
 * once, one of them is wrong.
 *
 * Pass `withArrow` for the sliding-arrow micro-interaction; it is the
 * house style for anything that navigates.
 */
const buttonVariants = cva(
  [
    "group relative inline-flex items-center justify-center gap-2.5",
    "font-medium tracking-tight whitespace-nowrap",
    "transition-[background-color,border-color,color,box-shadow,opacity] duration-500",
    "ease-[cubic-bezier(0.22,1,0.36,1)]",
    "focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-gold",
    "disabled:pointer-events-none disabled:opacity-40",
  ],
  {
    variants: {
      variant: {
        primary: "bg-gold text-canvas hover:bg-gold-bright hover:shadow-gold",
        outline:
          "border border-line-strong text-text hover:border-gold hover:text-gold",
        ghost: "text-muted hover:text-text hover:bg-surface",
        /* Inline text link — no box, gold underline wipes in on hover. */
        link: "link-underline p-0 text-text hover:text-gold",
      },
      size: {
        sm: "h-10 px-5 text-[0.8125rem] rounded-full",
        md: "h-12 px-7 text-sm rounded-full",
        lg: "h-14 px-9 text-[0.9375rem] rounded-full",
      },
    },
    compoundVariants: [
      /* The link variant is type, not a control — it must not take the
         pill height or horizontal padding of the boxed variants. */
      { variant: "link", class: "h-auto rounded-none px-0" },
    ],
    defaultVariants: { variant: "primary", size: "md" },
  }
);

type BaseProps = VariantProps<typeof buttonVariants> & {
  className?: string;
  children: ReactNode;
  /** Renders the sliding arrow. Default for navigation, off for form submits. */
  withArrow?: boolean;
  loading?: boolean;
  loadingText?: string;
};

function Inner({ children, withArrow, loading, loadingText }: { children: ReactNode; withArrow?: boolean; loading?: boolean; loadingText?: string }) {
  if (loading) {
    return (
      <>
        <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
        {loadingText || children}
      </>
    );
  }
  if (!withArrow) return <>{children}</>;
  return (
    <>
      {children}
      <ArrowRight
        className="h-4 w-4 shrink-0 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-1"
        aria-hidden="true"
      />
    </>
  );
}

type ButtonProps = BaseProps & ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({
  className,
  variant,
  size,
  children,
  withArrow,
  loading,
  loadingText,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      {...props}
    >
      <Inner withArrow={withArrow} loading={loading} loadingText={loadingText}>{children}</Inner>
    </button>
  );
}

type ButtonLinkProps = BaseProps & {
  href: string;
  external?: boolean;
  "aria-label"?: string;
};

export function ButtonLink({
  className,
  variant,
  size,
  children,
  href,
  external,
  withArrow,
  loading,
  loadingText,
  ...rest
}: ButtonLinkProps) {
  const classes = cn(
    buttonVariants({ variant, size }),
    loading && "pointer-events-none opacity-50",
    className
  );
  const inner = <Inner withArrow={withArrow} loading={loading} loadingText={loadingText}>{children}</Inner>;

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={classes}
        {...rest}
      >
        {inner}
      </a>
    );
  }
  return (
    <Link href={href} className={classes} {...rest}>
      {inner}
    </Link>
  );
}

export { buttonVariants };

