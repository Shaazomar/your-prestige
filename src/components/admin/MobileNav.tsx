"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

import { Logo } from "@/components/brand/Logo";
import type { Role } from "@prisma/client";
import { AdminNavList, SessionFooter } from "@/components/admin/Sidebar";

/**
 * Below `lg` the sidebar is hidden and, until this existed, nothing replaced
 * it — the CMS had no navigation at all on a phone or a portrait tablet. This
 * adds the missing entry point without changing the desktop layout, which
 * keeps the fixed rail and never renders this button.
 */
export function MobileNav({ user }: { user: { name: string; email: string; role: Role } }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close on route change so a tap on a link doesn't leave the panel over the page.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock body scroll behind the overlay, and close on Escape.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open navigation menu"
        aria-expanded={open}
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/12 text-white/70 transition-colors hover:border-gold hover:text-gold"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex">
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Admin navigation"
            className="relative flex h-full w-[17rem] max-w-[85vw] flex-col border-r border-white/8 bg-[#111110]"
          >
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/8 px-4">
              <Link href="/admin" className="flex items-center gap-2.5" aria-label="Prestige Admin">
                <Logo size="xs" tone="light" />
                <span className="border-l border-white/10 pl-2.5 text-[0.55rem] uppercase leading-tight tracking-[0.2em] text-white/30">
                  Command
                  <br />
                  Center
                </span>
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close navigation menu"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-white/50 transition-colors hover:bg-white/8 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 space-y-7 overflow-y-auto px-3 py-6">
              <AdminNavList role={user.role} pathname={pathname} onNavigate={() => setOpen(false)} />
            </nav>

            <div className="shrink-0 border-t border-white/8 p-4">
              <SessionFooter user={user} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
