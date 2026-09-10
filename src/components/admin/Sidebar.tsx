"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";

import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/Logo";
import { can } from "@/lib/permissions";
import type { Role } from "@prisma/client";
import { logoutAction } from "@/app/admin/(dashboard)/actions";
import { adminNav, roleLabels, isActive } from "@/components/admin/nav-config";

interface SidebarProps {
  user: { name: string; email: string; role: Role };
}

/** The nav list itself — shared by the desktop rail and the mobile drawer. */
export function AdminNavList({
  role,
  onNavigate,
  pathname,
}: {
  role: Role;
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <>
      {adminNav.map((group) => {
        const items = group.items.filter((item) => can(role, item.module, "view"));
        if (items.length === 0) return null;
        return (
          <div key={group.section}>
            <p className="mb-2 px-3 text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-white/25">
              {group.section}
            </p>
            <ul className="space-y-0.5">
              {items.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-all duration-300",
                        active
                          ? "bg-gold/12 font-medium text-gold"
                          : "text-white/55 hover:bg-white/5 hover:text-white"
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </>
  );
}

export function SessionFooter({ user }: SidebarProps) {
  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2.5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold/15 text-xs font-bold text-gold">
        {initials || "?"}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-white">{user.name}</p>
        <p className="truncate text-xs text-white/35">{roleLabels[user.role]}</p>
      </div>
      <form action={logoutAction}>
        <button
          type="submit"
          aria-label="Sign out"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-white/8 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-white/8 bg-[#111110] lg:flex">
      {/* Brand */}
      <div className="flex h-16 items-center border-b border-white/8 px-5">
        <Link href="/admin" className="flex items-center gap-2.5" aria-label="Prestige Admin">
          <Logo size="xs" tone="light" />
          <span className="border-l border-white/10 pl-2.5 text-[0.55rem] uppercase leading-tight tracking-[0.2em] text-white/30">
            Command
            <br />
            Center
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-7 overflow-y-auto px-3 py-6">
        <AdminNavList role={user.role} pathname={pathname} />
      </nav>

      {/* Session footer */}
      <div className="border-t border-white/8 p-4">
        <SessionFooter user={user} />
      </div>
    </aside>
  );
}
