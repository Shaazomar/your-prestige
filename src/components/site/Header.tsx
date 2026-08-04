"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { Search, Menu as MenuIcon } from "lucide-react";
import { primaryNav } from "@/lib/site-config";
import { Logo } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";
import { GlobalSearchModal } from "./GlobalSearchModal";
import { WishlistDrawer } from "./WishlistDrawer";
import { CompareDrawer } from "./CompareDrawer";
import { QuoteModal } from "./QuoteModal";
import { MegaMenu, type MegaMenuBusiness } from "./MegaMenu";

interface HeaderProps {
  /** Contact + social details, resolved from the CMS by the site layout. */
  business: MegaMenuBusiness;
}

/**
 * Floating glass navbar.
 *
 * Three scroll states, in order: transparent over the home hero, then a
 * glass pill, then the same pill condensed. It never touches the browser
 * edge — the outer wrapper always keeps a gutter.
 *
 * Transparency is scoped to the home hero specifically. Everywhere else the
 * pill stays glass, which keeps the light nav text legible regardless of what
 * the page underneath is doing.
 */
export function Header({ business }: HeaderProps) {
  const [condensed, setCondensed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);

  const pathname = usePathname();
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (y) => {
    setCondensed(y > 320);
  });

  // Close the overlays on navigation — Next keeps this component mounted
  // across route changes, so nothing else dismisses them.
  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  // ⌘K / Ctrl+K opens search from anywhere.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const floating = true;

  return (
    <>
      <motion.header
        initial={{ y: -72, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
        className={cn(
          "pointer-events-none fixed inset-x-0 top-0 z-50",
          "transition-[padding] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
          condensed ? "py-2.5" : "py-4 md:py-5"
        )}
      >
        <div className="mx-auto w-full max-w-[110rem] px-4 sm:px-6 lg:px-10">
          <div
            className={cn(
              "pointer-events-auto mx-auto flex items-center justify-between gap-6",
              "transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
              floating
                ? [
                    "glass rounded-full shadow-[0_8px_40px_rgb(0_0_0/0.55)]",
                    condensed
                      ? "max-w-5xl px-4 py-2 md:px-5"
                      : "max-w-6xl px-5 py-2.5 md:px-6 md:py-3",
                  ]
                : "max-w-none rounded-full border border-transparent bg-transparent px-1 py-2"
            )}
          >
            <Link
              href="/"
              className="relative z-10 shrink-0"
              aria-label={`${business.name} — Home`}
            >
              <Logo size={condensed ? "xs" : "sm"} tone="light" />
            </Link>

            <nav className="hidden items-center gap-9 lg:flex" aria-label="Primary">
              {primaryNav.map((item) => {
                const active =
                  pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative py-1 text-[0.8125rem] tracking-tight transition-colors duration-500",
                      active ? "text-gold" : "text-muted hover:text-text"
                    )}
                  >
                    {item.label}
                    {active && (
                      <motion.span
                        layoutId="nav-active"
                        className="absolute -bottom-0.5 left-0 right-0 h-px bg-gold"
                        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                      />
                    )}
                  </Link>
                );
              })}
            </nav>

            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                aria-label="Search"
                className={cn(
                  "grid h-9 w-9 place-items-center rounded-full text-muted",
                  "transition-colors duration-500 hover:bg-surface hover:text-text"
                )}
              >
                <Search className="h-[1.05rem] w-[1.05rem]" />
              </button>

              <button
                type="button"
                onClick={() => setQuoteOpen(true)}
                className={cn(
                  "hidden h-9 items-center rounded-full bg-gold px-5 text-[0.8125rem]",
                  "font-medium tracking-tight text-canvas sm:inline-flex",
                  "transition-colors duration-500 hover:bg-gold-bright"
                )}
              >
                Get Quote
              </button>

              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                aria-label="Open menu"
                aria-expanded={menuOpen}
                className={cn(
                  "grid h-9 w-9 place-items-center rounded-full text-text",
                  "transition-colors duration-500 hover:bg-surface"
                )}
              >
                <MenuIcon className="h-[1.15rem] w-[1.15rem]" />
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      <MegaMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onOpenSearch={() => {
          setMenuOpen(false);
          setSearchOpen(true);
        }}
        onOpenQuote={() => {
          setMenuOpen(false);
          setQuoteOpen(true);
        }}
        onOpenWishlist={() => {
          setMenuOpen(false);
          setWishlistOpen(true);
        }}
        business={business}
      />

      <GlobalSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      <WishlistDrawer
        isOpen={wishlistOpen}
        onClose={() => setWishlistOpen(false)}
        onOpenQuote={() => setQuoteOpen(true)}
      />
      <CompareDrawer />
      <QuoteModal isOpen={quoteOpen} onClose={() => setQuoteOpen(false)} />
    </>
  );
}
