"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { QuickViewModal } from "./QuickViewModal";

interface QuickViewContextValue {
  open: (slug: string) => void;
}

const QuickViewContext = createContext<QuickViewContextValue | null>(null);

/** Product cards call this to open the Quick View modal without prop-drilling a callback through every grid. */
export function useQuickView(): QuickViewContextValue {
  const ctx = useContext(QuickViewContext);
  if (!ctx) throw new Error("useQuickView must be used within QuickViewProvider");
  return ctx;
}

/** Mounted once near the root (site layout), alongside the other global drawers/modals. */
export function QuickViewProvider({ children }: { children: ReactNode }) {
  const [slug, setSlug] = useState<string | null>(null);

  const open = useCallback((s: string) => setSlug(s), []);
  const close = useCallback(() => setSlug(null), []);

  return (
    <QuickViewContext.Provider value={{ open }}>
      {children}
      <QuickViewModal slug={slug} onClose={close} />
    </QuickViewContext.Provider>
  );
}
