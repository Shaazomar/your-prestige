"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Home, Package, Tags, Award, Briefcase, Images, Video,
  MessageSquareQuote, PenSquare, HelpCircle, BadgePercent, Users2, CalendarClock,
  Bot, FolderOpen, Search, ShieldCheck, BarChart3, Settings, Wrench, ScrollText,
  Store, FileStack, MapPin, MessageSquarePlus, ShoppingCart, UserCheck, Building2,
  FileSpreadsheet, Warehouse, Ticket, Star, LineChart, SlidersHorizontal, LogOut,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/Logo";
import { can, type Module } from "@/lib/permissions";
import type { Role } from "@prisma/client";
import { logoutAction } from "@/app/admin/(dashboard)/actions";

const nav = [
  {
    section: "Overview",
    items: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard, module: "dashboard" as Module },
      { label: "Analytics", href: "/admin/analytics", icon: BarChart3, module: "analytics" as Module },
      { label: "Reports", href: "/admin/reports", icon: LineChart, module: "reports" as Module },
    ],
  },
  {
    section: "E-Commerce",
    items: [
      { label: "Orders", href: "/admin/orders", icon: ShoppingCart, module: "orders" as Module },
      { label: "Quotes (B2B)", href: "/admin/quotes", icon: FileSpreadsheet, module: "quotes" as Module },
      { label: "Dealers", href: "/admin/dealers", icon: Building2, module: "dealers" as Module },
      { label: "Customers", href: "/admin/customers", icon: UserCheck, module: "customers" as Module },
      { label: "Inventory", href: "/admin/inventory", icon: Warehouse, module: "inventory" as Module },
      { label: "Coupons", href: "/admin/coupons", icon: Ticket, module: "coupons" as Module },
      { label: "Reviews", href: "/admin/reviews", icon: Star, module: "reviews" as Module },
    ],
  },
  {
    section: "Catalog & PIM",
    items: [
      { label: "Products", href: "/admin/content/products", icon: Package, module: "products" as Module },
      { label: "Catalog Imports", href: "/admin/content/catalog-imports", icon: FileStack, module: "catalogImports" as Module },
      { label: "Categories", href: "/admin/content/categories", icon: Tags, module: "categories" as Module },
      { label: "Brands", href: "/admin/content/brands", icon: Award, module: "brands" as Module },
      { label: "Attributes & Specs", href: "/admin/attributes", icon: SlidersHorizontal, module: "attributes" as Module },
      { label: "Showrooms", href: "/admin/content/showrooms", icon: Store, module: "showrooms" as Module },
      { label: "Homepage", href: "/admin/content/homepage", icon: Home, module: "homepage" as Module },
      { label: "Portfolio", href: "/admin/content/portfolio", icon: Briefcase, module: "portfolio" as Module },
      { label: "Gallery", href: "/admin/content/gallery", icon: Images, module: "gallery" as Module },
      { label: "Videos", href: "/admin/content/videos", icon: Video, module: "videos" as Module },
      { label: "Testimonials", href: "/admin/content/testimonials", icon: MessageSquareQuote, module: "testimonials" as Module },
      { label: "Blog", href: "/admin/content/blog", icon: PenSquare, module: "blog" as Module },
      { label: "FAQs", href: "/admin/content/faqs", icon: HelpCircle, module: "faqs" as Module },
      { label: "Offers", href: "/admin/content/offers", icon: BadgePercent, module: "offers" as Module },
      { label: "Landing Pages", href: "/admin/content/landing-pages", icon: MapPin, module: "landingPages" as Module },
    ],
  },
  {
    section: "Growth & CRM",
    items: [
      { label: "Leads", href: "/admin/leads", icon: Users2, module: "leads" as Module },
      { label: "Bookings", href: "/admin/bookings", icon: CalendarClock, module: "bookings" as Module },
      { label: "AI Conversations", href: "/admin/conversations", icon: Bot, module: "conversations" as Module },
      { label: "Google Posts", href: "/admin/content/google-posts", icon: MessageSquarePlus, module: "showrooms" as Module },
    ],
  },
  {
    section: "System & Storage",
    items: [
      { label: "Media Library", href: "/admin/media", icon: FolderOpen, module: "media" as Module },
      { label: "SEO Engine", href: "/admin/seo", icon: Search, module: "seo" as Module },
      { label: "Users & Roles", href: "/admin/users", icon: ShieldCheck, module: "users" as Module },
      { label: "Settings", href: "/admin/settings", icon: Settings, module: "settings" as Module },
      { label: "Maintenance", href: "/admin/maintenance", icon: Wrench, module: "maintenance" as Module },
      { label: "Logs", href: "/admin/logs", icon: ScrollText, module: "logs" as Module },
    ],
  },
] as const;


const roleLabels: Record<Role, string> = {
  SUPER_ADMIN: "Super Admin",
  OWNER: "Owner",
  MARKETING: "Marketing",
  CONTENT: "Content Editor",
  SEO: "SEO Specialist",
  SUPPORT: "Support",
  VIEWER: "Viewer",
};

interface SidebarProps {
  user: { name: string; email: string; role: Role };
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

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
        {nav.map((group) => {
          const items = group.items.filter((item) => can(user.role, item.module, "view"));
          if (items.length === 0) return null;
          return (
            <div key={group.section}>
              <p className="mb-2 px-3 text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-white/25">
                {group.section}
              </p>
              <ul className="space-y-0.5">
                {items.map((item) => {
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
          );
        })}
      </nav>

      {/* Session footer */}
      <div className="border-t border-white/8 p-4">
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
      </div>
    </aside>
  );
}
