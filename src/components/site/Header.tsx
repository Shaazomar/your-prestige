"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useScroll } from "framer-motion";
import { Search, Phone, Heart, Layers, Sparkles, ChevronDown, Download } from "lucide-react";
import { mainNav } from "@/lib/site-config";
import { ButtonLink } from "@/components/ui/Button";
import { Logo } from "@/components/brand/Logo";

import { telHref } from "@/lib/business";
import { cn } from "@/lib/utils";
import { GlobalSearchModal } from "./GlobalSearchModal";
import { WishlistDrawer } from "./WishlistDrawer";
import { CompareDrawer } from "./CompareDrawer";
import { QuoteModal } from "./QuoteModal";
import { MegaMenu } from "./MegaMenu";
import { useLocalCollection, WISHLIST_KEY } from "@/hooks/useLocalCollection";
import { useCompare } from "@/hooks/useCompare";

interface HeaderProps {
  business: { name: string; phone: string; address: string };
}

export function Header({ business }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);

  const pathname = usePathname();
  const { scrollY } = useScroll();

  const { items: wishlistItems } = useLocalCollection(WISHLIST_KEY, 24);
  const { count: compareCount } = useCompare();

  useEffect(() => {
    return scrollY.on("change", (y) => setScrolled(y > 30));
  }, [scrollY]);

  useEffect(() => {
    setMenuOpen(false);
    setMegaOpen(false);
  }, [pathname]);

  const isHome = pathname === "/";
  const overDark = isHome && !scrolled && !menuOpen;

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        className="fixed inset-x-0 top-0 z-50 py-4 transition-all duration-500 pointer-events-none"
      >
        <div className="mx-auto max-w-[110rem] px-4 sm:px-6 md:px-10 lg:px-14">
          <div
            className={cn(
              "pointer-events-auto mx-auto flex items-center justify-between transition-all duration-500",
              scrolled
                ? "max-w-6xl rounded-full bg-white/90 px-6 py-2.5 shadow-float backdrop-blur-xl border border-stone-200/80"
                : "w-full rounded-2xl bg-transparent py-2"
            )}
          >
            {/* Logo */}
            <Link href="/" className="group relative z-50 shrink-0" aria-label={`${business.name} — Home`}>
              <Logo size="sm" tone={overDark || menuOpen ? "light" : "dark"} />
            </Link>

            {/* Desktop Nav Links */}
            <nav className="hidden items-center gap-7 lg:flex relative" aria-label="Primary">
              {mainNav.slice(0, 7).map((item) => {
                const isActive = pathname === item.href;
                const isProducts = item.label === "Products";

                return (
                  <div
                    key={item.href}
                    className="relative group"
                    onMouseEnter={() => isProducts && setMegaOpen(true)}
                  >
                    <Link
                      href={item.href}
                      className={cn(
                        "relative text-xs font-bold uppercase tracking-wider transition-colors duration-300 py-2 inline-flex items-center gap-1",
                        overDark
                          ? isActive
                            ? "text-accent font-bold"
                            : "text-white/90 hover:text-accent"
                          : isActive
                          ? "text-accent font-bold"
                          : "text-ink/80 hover:text-accent"
                      )}
                    >
                      {item.label}
                      {isProducts && <ChevronDown className="h-3 w-3 text-accent transition-transform group-hover:rotate-180" />}
                      {isActive && (
                        <motion.div
                          layoutId="activeNavIndicator"
                          className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent rounded-full"
                        />
                      )}
                    </Link>

                    {/* Products Mega Menu Dropdown */}
                    {isProducts && (
                      <AnimatePresence>
                        {megaOpen && <MegaMenu onClose={() => setMegaOpen(false)} />}
                      </AnimatePresence>
                    )}
                  </div>
                );
              })}
            </nav>

            {/* Actions & Overlays */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Global Search button */}
              <button
                onClick={() => setSearchOpen(true)}
                className={cn(
                  "flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-bold transition-all duration-300",
                  overDark
                    ? "border-white/20 bg-white/10 text-white hover:border-accent hover:text-accent"
                    : "border-stone-200 bg-white text-slate-warm hover:border-accent hover:text-ink shadow-xs"
                )}
                aria-label="Open search"
              >
                <Search className="h-3.5 w-3.5 text-accent" />
                <span className="hidden sm:inline">Search</span>
                <kbd className="hidden md:inline-block rounded bg-stone-100 px-1.5 py-0.5 text-[9px] text-stone-500 font-sans">
                  ⌘K
                </kbd>
              </button>

              {/* Wishlist Button */}
              <button
                onClick={() => setWishlistOpen(true)}
                className={cn(
                  "relative flex h-9 w-9 items-center justify-center rounded-full border transition-all duration-300",
                  overDark
                    ? "border-white/20 bg-white/10 text-white hover:border-accent hover:text-accent"
                    : "border-stone-200 bg-white text-ink hover:border-accent shadow-xs"
                )}
                aria-label="View saved wishlist"
              >
                <Heart className={cn("h-4 w-4", wishlistItems.length > 0 && "text-accent fill-accent")} />
                {wishlistItems.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-ink shadow-xs">
                    {wishlistItems.length}
                  </span>
                )}
              </button>

              {/* Compare Counter */}
              {compareCount > 0 && (
                <Link
                  href="/compare"
                  className="relative flex h-9 w-9 items-center justify-center rounded-full border border-accent bg-accent/10 text-accent transition-all hover:bg-accent hover:text-ink"
                  title="View product comparison"
                >
                  <Layers className="h-4 w-4" />
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-ink text-[10px] font-bold text-accent">
                    {compareCount}
                  </span>
                </Link>
              )}

              {/* Download Catalogue Icon Button */}
              <Link
                href="/catalogue"
                className={cn(
                  "hidden xl:flex h-9 w-9 items-center justify-center rounded-full border transition-all duration-300",
                  overDark
                    ? "border-white/20 text-white hover:border-accent hover:text-accent"
                    : "border-stone-200 text-ink hover:border-accent hover:text-accent"
                )}
                title="Download Catalogue PDF"
              >
                <Download className="h-4 w-4" />
              </Link>

              {/* Call */}
              <a
                href={telHref(business.phone)}
                className={cn(
                  "hidden h-9 w-9 items-center justify-center rounded-full border transition-all duration-300 md:flex",
                  overDark
                    ? "border-white/20 text-white hover:bg-white hover:text-ink"
                    : "border-stone-200 text-ink hover:bg-ink hover:text-white"
                )}
                aria-label="Call showroom"
              >
                <Phone className="h-4 w-4" />
              </a>

              {/* Get Quote Button */}
              <button
                onClick={() => setQuoteOpen(true)}
                className="hidden md:inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-xs font-bold uppercase tracking-wider text-ink hover:bg-accent-hover transition-colors shadow-yellow"
              >
                <Sparkles className="h-3.5 w-3.5" /> Get Quote
              </button>

              {/* Mobile Hamburger */}
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="relative z-50 flex h-9 w-9 flex-col items-center justify-center gap-[5px] lg:hidden"
                aria-label={menuOpen ? "Close menu" : "Open menu"}
              >
                <span
                  className={cn(
                    "h-[2px] w-5 transition-all duration-300",
                    overDark || menuOpen ? "bg-white" : "bg-ink",
                    menuOpen && "translate-y-[7px] rotate-45"
                  )}
                />
                <span
                  className={cn(
                    "h-[2px] w-5 transition-all duration-300",
                    overDark || menuOpen ? "bg-white" : "bg-ink",
                    menuOpen && "opacity-0"
                  )}
                />
                <span
                  className={cn(
                    "h-[2px] w-5 transition-all duration-300",
                    overDark || menuOpen ? "bg-white" : "bg-ink",
                    menuOpen && "-translate-y-[7px] -rotate-45"
                  )}
                />
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Global Modals & Drawers */}
      <GlobalSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      <WishlistDrawer
        isOpen={wishlistOpen}
        onClose={() => setWishlistOpen(false)}
        onOpenQuote={() => setQuoteOpen(true)}
      />
      <CompareDrawer />
      <QuoteModal isOpen={quoteOpen} onClose={() => setQuoteOpen(false)} />

      {/* Mobile Fullscreen Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-40 bg-charcoal text-white lg:hidden overflow-y-auto"
          >
            <div className="flex h-full flex-col justify-between px-8 pb-12 pt-28">
              <nav aria-label="Mobile Navigation">
                <ul className="space-y-5">
                  {mainNav.map((item, i) => (
                    <motion.li
                      key={item.href}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + i * 0.04 }}
                    >
                      <Link
                        href={item.href}
                        className={cn(
                          "block text-3xl font-bold tracking-tight text-white/90 hover:text-accent transition-colors",
                          pathname === item.href && "text-accent"
                        )}
                      >
                        {item.label}
                      </Link>
                    </motion.li>
                  ))}
                </ul>
              </nav>

              <div className="space-y-4 pt-8 border-t border-white/10">
                <ButtonLink href="/book-visit" variant="gold" size="lg" className="w-full shadow-yellow font-bold">
                  Book a Showroom Visit
                </ButtonLink>
                <div className="flex justify-between items-center text-xs text-stone-400 pt-2">
                  <span>Call: {business.phone}</span>
                  <Link href="/catalogue" className="text-accent underline font-bold">Lookbook PDF</Link>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
