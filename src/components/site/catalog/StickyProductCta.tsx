"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { buildWhatsAppLink } from "@/lib/whatsapp";

interface Props {
  name: string;
  brand: string;
  whatsappNumber: string;
}

/**
 * Mobile-only sticky enquiry bar.
 *
 * Deliberately absent until the visitor has scrolled past the hero: while the
 * product's own CTA is still on screen the bar would be a second copy of a
 * button they can already see, and it would cover product imagery to say so.
 *
 * Sits above the iOS home indicator via `env(safe-area-inset-bottom)`, and is
 * hidden on `md` and up where the in-page CTA never leaves the viewport.
 */
export function StickyProductCta({ name, brand, whatsappNumber }: Props) {
  const [visible, setVisible] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 640);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const href = buildWhatsAppLink(
    whatsappNumber,
    `Hello Prestige Tiles,\n\nI'm interested in *${name}* (${brand}).\n\nCould you share pricing and availability?`
  );

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={reduced ? false : { y: "100%" }}
          animate={{ y: 0 }}
          exit={reduced ? undefined : { y: "100%" }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-x-0 bottom-0 z-40 md:hidden"
        >
          <div className="glass-strong border-t border-line pb-[env(safe-area-inset-bottom)]">
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[0.8125rem] font-medium leading-tight text-text">
                  {name}
                </p>
                <p className="truncate text-[0.6875rem] uppercase tracking-[0.14em] text-gold">
                  {brand}
                </p>
              </div>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 shrink-0 items-center rounded-full bg-gold px-6 text-sm font-semibold tracking-tight text-text transition-colors duration-300 hover:bg-gold-bright"
              >
                Enquire
              </a>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
