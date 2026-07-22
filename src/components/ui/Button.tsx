import Link from "next/link";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, ReactNode } from "react";

const buttonVariants = cva(
  [
    "group relative inline-flex items-center justify-center gap-2.5 overflow-hidden",
    "font-medium tracking-wide transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold",
    "disabled:pointer-events-none disabled:opacity-50",
  ],
  {
    variants: {
      variant: {
        primary:
          "bg-ink text-ivory hover:bg-graphite hover:shadow-float",
        gold:
          "bg-gold text-ivory hover:bg-gold-deep hover:shadow-gold",
        outline:
          "border border-ink/20 text-ink hover:border-ink hover:bg-ink hover:text-ivory",
        "outline-light":
          "border border-ivory/30 text-ivory hover:border-ivory hover:bg-ivory hover:text-ink",
        ghost: "text-ink hover:bg-ink/5",
        "ghost-light": "text-ivory hover:bg-ivory/10",
      },
      size: {
        sm: "h-10 px-5 text-sm rounded-full",
        md: "h-12 px-7 text-sm rounded-full",
        lg: "h-14 px-9 text-base rounded-full",
        xl: "h-16 px-11 text-base rounded-full",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

type BaseProps = VariantProps<typeof buttonVariants> & {
  className?: string;
  children: ReactNode;
};

type ButtonProps = BaseProps & ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({ className, variant, size, children, ...props }: ButtonProps) {
  return (
    <button className={cn(buttonVariants({ variant, size }), className)} {...props}>
      {children}
    </button>
  );
}

type ButtonLinkProps = BaseProps & { href: string; external?: boolean };

export function ButtonLink({
  className,
  variant,
  size,
  children,
  href,
  external,
}: ButtonLinkProps) {
  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(buttonVariants({ variant, size }), className)}
      >
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cn(buttonVariants({ variant, size }), className)}>
      {children}
    </Link>
  );
}
