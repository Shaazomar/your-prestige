"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useScroll } from "framer-motion";
import { Phone, ArrowUpRight } from "lucide-react";
import { mainNav } from "@/lib/site-config";
import { Magnetic } from "@/components/motion/MagneticButton";
import { ButtonLink } from "@/components/ui/Button";
import { WishlistLink } from "@/components/site/WishlistLink";
import { Logo } from "@/components/brand/Logo";
import { telHref } from "@/lib/business";
import { cn } from "@/lib/utils";

interface HeaderProps {
  /** CMS-managed business details, passed down from the server layout. */
  business: { name: string; phone: string; address: string };
}

export function Header({ business }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const { scrollY } = useScroll();

  useEffect(() => {
    return scrollY.on("change", (y) => setScrolled(y > 40));
  }, [scrollY]);

  // Close overlay on navigation
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Dark hero pages render light text until scrolled
  const overDark = pathname === "/" && !scrolled && !menuOpen;

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-all duration-500",
          scrolled && !menuOpen ? "glass shadow-soft" : "bg-transparent"
        )}
      >
        <div className="mx-auto flex h-20 max-w-[110rem] items-center justify-between px-6 md:px-10 lg:px-14">
          {/* Official brand lockup */}
          <Link
            href="/"
            className="group relative z-50"
            aria-label={`${business.name} — Home`}
          >
            <Logo size="sm" tone={overDark || menuOpen ? "light" : "dark"} />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-9 lg:flex" aria-label="Primary">
            {mainNav.slice(0, 7).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "link-gold text-sm font-medium tracking-wide transition-colors duration-500",
                  overDark ? "text-ivory/90 hover:text-ivory" : "text-ink/80 hover:text-ink",
                  pathname === item.href && "text-gold"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <a
              href={telHref(business.phone)}
              className={cn(
                "hidden h-11 w-11 items-center justify-center rounded-full border transition-all duration-500 md:flex",
                overDark
                  ? "border-ivory/25 text-ivory hover:bg-ivory hover:text-ink"
                  : "border-ink/15 text-ink hover:bg-ink hover:text-ivory"
              )}
              aria-label="Call showroom"
            >
              <Phone className="h-4 w-4" />
            </a>
            <WishlistLink dark={overDark} />
            <Magnetic>
              <ButtonLink
                href="/book-visit"
                size="sm"
                variant={overDark ? "outline-light" : "primary"}
                className="hidden md:inline-flex"
              >
                Book a Visit
                <ArrowUpRight className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </ButtonLink>
            </Magnetic>

            {/* Burger */}
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="relative z-50 flex h-11 w-11 flex-col items-center justify-center gap-[5px] lg:hidden"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
            >
              <span
                className={cn(
                  "h-[1.5px] w-6 transition-all duration-500",
                  overDark || menuOpen ? "bg-ivory" : "bg-ink",
                  menuOpen && "translate-y-[6.5px] rotate-45"
                )}
              />
              <span
                className={cn(
                  "h-[1.5px] w-6 transition-all duration-500",
                  overDark || menuOpen ? "bg-ivory" : "bg-ink",
                  menuOpen && "opacity-0"
                )}
              />
              <span
                className={cn(
                  "h-[1.5px] w-6 transition-all duration-500",
                  overDark || menuOpen ? "bg-ivory" : "bg-ink",
                  menuOpen && "-translate-y-[6.5px] -rotate-45"
                )}
              />
            </button>
          </div>
        </div>
      </motion.header>

      {/* Fullscreen mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-40 bg-ink lg:hidden"
          >
            <div className="flex h-full flex-col justify-between px-8 pb-12 pt-32">
              <nav aria-label="Mobile">
                <ul className="space-y-2">
                  {mainNav.map((item, i) => (
                    <motion.li
                      key={item.href}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: 0.15 + i * 0.06,
                        duration: 0.7,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                    >
                      <Link
                        href={item.href}
                        className={cn(
                          "block py-1 text-4xl font-semibold tracking-tight text-ivory transition-colors hover:text-gold",
                          pathname === item.href && "text-gold"
                        )}
                      >
                        {item.label}
                      </Link>
                    </motion.li>
                  ))}
                </ul>
              </nav>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.6 }}
                className="space-y-4"
              >
                <ButtonLink href="/book-visit" variant="gold" size="lg" className="w-full">
                  Book a Showroom Visit
                </ButtonLink>
                <p className="text-center text-sm text-ivory/40">{business.phone}</p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
