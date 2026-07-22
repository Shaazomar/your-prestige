"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Home, Package, Tags, Award, Briefcase, Images, Video,
  MessageSquareQuote, PenSquare, HelpCircle, BadgePercent, Users2, CalendarClock,
  Bot, FolderOpen, Search, ShieldCheck, BarChart3, Settings, Wrench, ScrollText,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  {
    section: "Overview",
    items: [{ label: "Dashboard", href: "/admin", icon: LayoutDashboard }],
  },
  {
    section: "Content",
    items: [
      { label: "Homepage", href: "/admin/content/homepage", icon: Home },
      { label: "Products", href: "/admin/content/products", icon: Package },
      { label: "Categories", href: "/admin/content/categories", icon: Tags },
      { label: "Brands", href: "/admin/content/brands", icon: Award },
      { label: "Portfolio", href: "/admin/content/portfolio", icon: Briefcase },
      { label: "Gallery", href: "/admin/content/gallery", icon: Images },
      { label: "Videos", href: "/admin/content/videos", icon: Video },
      { label: "Testimonials", href: "/admin/content/testimonials", icon: MessageSquareQuote },
      { label: "Blog", href: "/admin/content/blog", icon: PenSquare },
      { label: "FAQs", href: "/admin/content/faqs", icon: HelpCircle },
      { label: "Offers", href: "/admin/content/offers", icon: BadgePercent },
    ],
  },
  {
    section: "Growth",
    items: [
      { label: "Leads", href: "/admin/leads", icon: Users2 },
      { label: "Bookings", href: "/admin/bookings", icon: CalendarClock },
      { label: "AI Conversations", href: "/admin/conversations", icon: Bot },
      { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    ],
  },
  {
    section: "System",
    items: [
      { label: "Media Library", href: "/admin/media", icon: FolderOpen },
      { label: "SEO", href: "/admin/seo", icon: Search },
      { label: "Users & Roles", href: "/admin/users", icon: ShieldCheck },
      { label: "Settings", href: "/admin/settings", icon: Settings },
      { label: "Maintenance", href: "/admin/maintenance", icon: Wrench },
      { label: "Logs", href: "/admin/logs", icon: ScrollText },
    ],
  },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-white/8 bg-[#111110] lg:flex">
      {/* Brand */}
      <div className="flex h-16 items-center border-b border-white/8 px-6">
        <Link href="/admin" className="block">
          <span className="text-sm font-bold uppercase tracking-[0.22em] text-ivory">
            Your <span className="text-gold">Prestige</span>
          </span>
          <span className="block text-[0.6rem] uppercase tracking-[0.35em] text-white/30">
            Command Center
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-7 overflow-y-auto px-3 py-6">
        {nav.map((group) => (
          <div key={group.section}>
            <p className="mb-2 px-3 text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-white/25">
              {group.section}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active =
                  item.href === "/admin"
                    ? pathname === "/admin"
                    : pathname.startsWith(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
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
        ))}
      </nav>

      {/* Session footer */}
      <div className="border-t border-white/8 p-4">
        <div className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/15 text-xs font-bold text-gold">
            SO
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">Showroom Owner</p>
            <p className="text-xs text-white/35">Super Admin</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
