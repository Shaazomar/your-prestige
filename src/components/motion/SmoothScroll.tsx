"use client";

import { ReactLenis } from "lenis/react";
import type { ReactNode } from "react";

/** Buttery 60fps momentum scrolling via Lenis. Wraps the site shell. */
export function SmoothScroll({ children }: { children: ReactNode }) {
  return (
    <ReactLenis
      root
      options={{
        lerp: 0.09,
        duration: 1.3,
        smoothWheel: true,
      }}
    >
      {children}
    </ReactLenis>
  );
}
