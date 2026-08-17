import { cn } from "@/lib/utils";
import type { ElementType, ReactNode } from "react";

interface ContainerProps {
  children: ReactNode;
  className?: string;
  as?: ElementType;
  /**
   * `default` is the house measure and what almost everything should use.
   * `wide` is for full-bleed editorial rows; `narrow` for long-form prose,
   * where a comfortable line length matters more than filling the viewport.
   */
  size?: "default" | "wide" | "narrow";
}

/**
 * The one horizontal gutter in the system.
 *
 * Padding steps deliberately, so content never touches the viewport edge
 * at any breakpoint: 20px on phones, 32px on tablets, up to 80px on large
 * desktops. Nothing else in the codebase should be setting page-level
 * horizontal padding — if a section needs to break out, it should sit
 * outside Container rather than fight it.
 */
export function Container({
  children,
  className,
  as: Tag = "div",
  size = "default",
}: ContainerProps) {
  return (
    <Tag
      className={cn(
        "mx-auto w-full px-5 sm:px-8 lg:px-12 xl:px-16 2xl:px-20",
        size === "default" && "max-w-[92.5rem]",
        size === "wide" && "max-w-[110rem]",
        size === "narrow" && "max-w-3xl",
        className
      )}
    >
      {children}
    </Tag>
  );
}
