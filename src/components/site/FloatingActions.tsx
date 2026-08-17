"use client";

import { motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * Persistent WhatsApp affordance.
 *
 * A pill rather than the usual saturated green circle: on desktop it reads as
 * part of the page's typography, with the brand green kept to the glyph. The
 * full-strength green bubble is the single most template-looking element on a
 * site like this, and it undercuts everything else.
 *
 * On product pages the mobile sticky enquiry bar owns the bottom of the
 * screen, so this hides itself below `md` there rather than stacking two
 * competing calls to action on top of each other.
 */
export function FloatingActions({ whatsapp }: { whatsapp: string; phone?: string }) {
  const pathname = usePathname();
  const reduced = useReducedMotion();

  const onProductPage = /^\/products\/[^/]+\/[^/]+$/.test(pathname);
  const href = `https://wa.me/${whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
    "Hi Prestige! I'd like to know more about your collections."
  )}`;

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "fixed bottom-5 right-5 z-40 md:bottom-7 md:right-7",
        // Clear of the iOS home indicator.
        "pb-[env(safe-area-inset-bottom)]",
        onProductPage && "hidden md:block"
      )}
    >
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with us on WhatsApp"
        className={cn(
          "group flex h-12 items-center gap-2.5 rounded-full px-4 md:h-13 md:px-5",
          "glass-strong shadow-lift",
          "text-sm font-medium tracking-tight text-text",
          "transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          "hover:-translate-y-0.5"
        )}
      >
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-[1.15rem] w-[1.15rem] shrink-0 text-[#25D366]"
          aria-hidden="true"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
        <span className="hidden sm:inline">WhatsApp</span>
      </a>
    </motion.div>
  );
}
