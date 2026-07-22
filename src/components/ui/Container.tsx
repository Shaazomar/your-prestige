import { cn } from "@/lib/utils";
import type { ElementType, ReactNode } from "react";

interface ContainerProps {
  children: ReactNode;
  className?: string;
  as?: ElementType;
  /** wide = edge-to-edge editorial, default = comfortable reading measure */
  size?: "default" | "wide" | "narrow";
}

export function Container({
  children,
  className,
  as: Tag = "div",
  size = "default",
}: ContainerProps) {
  return (
    <Tag
      className={cn(
        "mx-auto w-full px-6 md:px-10 lg:px-14",
        size === "default" && "max-w-7xl",
        size === "wide" && "max-w-[110rem]",
        size === "narrow" && "max-w-3xl",
        className
      )}
    >
      {children}
    </Tag>
  );
}
