"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { X, Search, ArrowUpRight, Phone, MessageCircle } from "lucide-react";
import { megaMenu, type NavLink } from "@/lib/site-config";
import { telHref, waHref } from "@/lib/business";
import { cn } from "@/lib/utils";

export interface MegaMenuBusiness {
  name: string;
  phone: string;
  address: string;
  whatsapp?: string;
  instagram?: string;
  facebook?: string;
  threads?: string;
}

interface MegaMenuProps {
  open: boolean;
  onClose: () => void;
  onOpenSearch: () => void;
  onOpenQuote: () => void;
  onOpenWishlist: () => void;
  business: MegaMenuBusiness;
}

/** The house easing curve. Typed as a tuple — Framer rejects a plain number[]. */
const EASE = [0.22, 1, 0.36, 1] as const;

/** Staggered rise, shared by the display list and the supporting columns. */
const rise: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: 0.06 + i * 0.035, ease: EASE },
  }),
};

/**
 * Fullscreen navigation. There are no dropdowns anywhere in the system —
 * this is the one surface that holds everything the navbar doesn't.
 *
 * Eight destinations render as large editorial type; the supporting columns
 * carry the rest of the site, so nothing became unreachable in the 2.0 cut.
 */
export function MegaMenu({
  open,
  onClose,
  onOpenSearch,
  onOpenQuote,
  onOpenWishlist,
  business,
}: MegaMenuProps) {
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Lock the page behind the overlay. Restoring the exact scrollY matters —
  // position:fixed on <body> otherwise returns the user to the top on close.
  useEffect(() => {
    if (!open) return;
    const y = window.scrollY;
    const { body } = document;
    const prev = {
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      overflowY: body.style.overflowY,
    };
    body.style.position = "fixed";
    body.style.top = `-${y}px`;
    body.style.width = "100%";
    body.style.overflowY = "scroll";

    return () => {
      Object.assign(body.style, prev);
      window.scrollTo(0, y);
    };
  }, [open]);

  // Escape closes; Tab cycles within the panel.
  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;

      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const socials = [
    { label: "Instagram", href: business.instagram },
    { label: "Facebook", href: business.facebook },
    { label: "Threads", href: business.threads },
  ].filter((s): s is { label: string; href: string } => Boolean(s.href));

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[60] overflow-y-auto bg-canvas"
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
          ref={panelRef}
        >
          <div className="mx-auto flex min-h-full w-full max-w-[110rem] flex-col px-6 pb-16 pt-6 sm:px-8 lg:px-14">
            {/* ——— Bar ——— */}
            <div className="flex items-center justify-between gap-4 border-b border-line pb-6">
              <Link
                href="/"
                onClick={onClose}
                className="text-eyebrow text-muted transition-colors hover:text-gold"
              >
                {business.name}
              </Link>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onOpenSearch}
                  className="inline-flex h-10 items-center gap-2.5 rounded-full border border-line px-4 text-[0.8125rem] text-muted transition-colors duration-500 hover:border-line-strong hover:text-text"
                >
                  <Search className="h-4 w-4" />
                  <span className="hidden sm:inline">Search</span>
                  <kbd className="hidden rounded border border-line px-1.5 py-0.5 text-[0.625rem] text-faint md:inline">
                    ⌘K
                  </kbd>
                </button>

                <button
                  ref={closeRef}
                  type="button"
                  onClick={onClose}
                  aria-label="Close menu"
                  className="grid h-11 w-11 place-items-center rounded-full border border-line text-text transition-colors duration-500 hover:border-gold hover:text-gold"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* ——— Body ——— */}
            <div className="grid flex-1 gap-14 py-12 lg:grid-cols-[1.15fr_1fr] lg:gap-20 lg:py-16">
              <nav aria-label="Main sections">
                <ul>
                  {megaMenu.primary.map((item, i) => {
                    const active =
                      pathname === item.href || pathname.startsWith(`${item.href}/`);
                    return (
                      <motion.li
                        key={item.href}
                        custom={i}
                        variants={rise}
                        initial="hidden"
                        animate="show"
                        className="border-b border-line last:border-b-0"
                      >
                        <Link
                          href={item.href}
                          onClick={onClose}
                          className="group flex items-baseline justify-between gap-6 py-4 md:py-5"
                        >
                          <span
                            className={cn(
                              "text-h2 transition-colors duration-500",
                              active ? "text-gold" : "text-text group-hover:text-gold"
                            )}
                          >
                            {item.label}
                          </span>
                          <span className="flex items-baseline gap-4">
                            {item.hint && (
                              <span className="hidden text-sm text-faint md:inline">
                                {item.hint}
                              </span>
                            )}
                            <ArrowUpRight
                              className="h-5 w-5 shrink-0 self-center text-faint opacity-0 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-0.5 group-hover:text-gold group-hover:opacity-100"
                              aria-hidden="true"
                            />
                          </span>
                        </Link>
                      </motion.li>
                    );
                  })}
                </ul>
              </nav>

              <div className="grid gap-10 sm:grid-cols-2">
                <MenuColumn title="Catalogue" links={megaMenu.catalogue} index={0} onClose={onClose} />
                <MenuColumn title="Spaces" links={megaMenu.spaces} index={1} onClose={onClose} />
                <MenuColumn title="Company" links={megaMenu.company} index={2} onClose={onClose} />
                <MenuColumn title="Visit & Enquire" links={megaMenu.visit} index={3} onClose={onClose} />

                <motion.div
                  custom={4}
                  variants={rise}
                  initial="hidden"
                  animate="show"
                  className="sm:col-span-2"
                >
                  <div className="flex flex-wrap gap-2.5">
                    <button
                      type="button"
                      onClick={onOpenQuote}
                      className="inline-flex h-11 items-center rounded-full bg-gold px-6 text-[0.8125rem] font-medium text-canvas transition-colors duration-500 hover:bg-gold-bright"
                    >
                      Get a Quote
                    </button>
                    <button
                      type="button"
                      onClick={onOpenWishlist}
                      className="inline-flex h-11 items-center rounded-full border border-line-strong px-6 text-[0.8125rem] text-text transition-colors duration-500 hover:border-gold hover:text-gold"
                    >
                      Saved Items
                    </button>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* ——— Foot ——— */}
            <motion.div
              custom={5}
              variants={rise}
              initial="hidden"
              animate="show"
              className="mt-auto flex flex-col gap-6 border-t border-line pt-8 md:flex-row md:items-center md:justify-between"
            >
              <div className="flex flex-wrap items-center gap-x-7 gap-y-3">
                <a
                  href={telHref(business.phone)}
                  className="inline-flex items-center gap-2.5 text-sm text-muted transition-colors duration-500 hover:text-gold"
                >
                  <Phone className="h-4 w-4" />
                  {business.phone}
                </a>
                {business.whatsapp && (
                  <a
                    href={waHref(business.whatsapp)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2.5 text-sm text-muted transition-colors duration-500 hover:text-gold"
                  >
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </a>
                )}
                <p className="max-w-sm text-sm text-faint">{business.address}</p>
              </div>

              {socials.length > 0 && (
                <div className="flex items-center gap-6">
                  {socials.map((s) => (
                    <a
                      key={s.label}
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-eyebrow text-muted transition-colors duration-500 hover:text-gold"
                    >
                      {s.label}
                    </a>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function MenuColumn({
  title,
  links,
  index,
  onClose,
}: {
  title: string;
  links: readonly NavLink[];
  index: number;
  onClose: () => void;
}) {
  return (
    <motion.div custom={index} variants={rise} initial="hidden" animate="show">
      <h2 className="text-eyebrow mb-5 text-faint">{title}</h2>
      <ul className="space-y-3">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              onClick={onClose}
              className="text-sm text-muted transition-colors duration-500 hover:text-gold"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}
