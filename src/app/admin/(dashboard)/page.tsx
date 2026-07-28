import Link from "next/link";
import {
  Users2, CalendarClock, Sparkles, TrendingUp, ArrowUpRight, Package, Tags, Award,
  Images, Video, PenSquare, MessageSquareQuote, BadgePercent, BarChart3, Activity, Store,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { LeadsChart } from "@/components/admin/LeadsChart";

export const dynamic = "force-dynamic";

const statusStyles: Record<string, string> = {
  NEW: "bg-gold/15 text-gold",
  CONTACTED: "bg-sky-400/15 text-sky-300",
  QUALIFIED: "bg-violet-400/15 text-violet-300",
  VISITED: "bg-emerald-400/15 text-emerald-300",
  QUOTED: "bg-amber-400/15 text-amber-300",
  WON: "bg-emerald-500/20 text-emerald-300",
  LOST: "bg-white/8 text-white/40",
};

export default async function AdminDashboard() {
  const since = new Date();
  since.setDate(since.getDate() - 13);
  since.setHours(0, 0, 0, 0);

  const [
    totalLeads, newLeads, wonLeads, recentLeads, chartLeads,
    productCount, brandCount, categoryCount, galleryCount, videoCount,
    blogCount, testimonialCount, offerCount, pendingBookings, recentLogs, showroomCount,
  ] = await Promise.all([
    prisma.lead.count({ where: { deletedAt: null } }),
    prisma.lead.count({ where: { status: "NEW", deletedAt: null } }),
    prisma.lead.count({ where: { status: "WON", deletedAt: null } }),
    prisma.lead.findMany({ where: { deletedAt: null }, orderBy: { createdAt: "desc" }, take: 6 }),
    prisma.lead.findMany({ where: { createdAt: { gte: since }, deletedAt: null }, select: { createdAt: true } }),
    prisma.product.count({ where: { deletedAt: null } }),
    prisma.brand.count({ where: { deletedAt: null } }),
    prisma.category.count({ where: { deletedAt: null } }),
    prisma.galleryItem.count({ where: { deletedAt: null } }),
    prisma.video.count({ where: { deletedAt: null } }),
    prisma.post.count({ where: { deletedAt: null } }),
    prisma.testimonial.count({ where: { deletedAt: null } }),
    prisma.offer.count({ where: { deletedAt: null } }),
    prisma.booking.count({ where: { status: "PENDING", deletedAt: null } }),
    prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 8, include: { user: { select: { name: true } } } }),
    prisma.showroom.count({ where: { deletedAt: null } }),
  ]);

  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    return d;
  });
  const chartData = days.map((d) => ({
    label: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
    count: chartLeads.filter((l) => l.createdAt.toDateString() === d.toDateString()).length,
  }));

  const conversion = totalLeads === 0 ? 0 : Math.round((wonLeads / totalLeads) * 100);

  const heroStats = [
    { label: "Total Leads", value: totalLeads, icon: Users2 },
    { label: "New / Unattended", value: newLeads, icon: Sparkles },
    { label: "Pending Bookings", value: pendingBookings, icon: CalendarClock },
    { label: "Win Rate", value: `${conversion}%`, icon: TrendingUp },
  ];

  const contentStats = [
    { label: "Showrooms", value: showroomCount, icon: Store, href: "/admin/content/showrooms" },
    { label: "Products", value: productCount, icon: Package, href: "/admin/content/products" },
    { label: "Brands", value: brandCount, icon: Award, href: "/admin/content/brands" },
    { label: "Categories", value: categoryCount, icon: Tags, href: "/admin/content/categories" },
    { label: "Gallery Images", value: galleryCount, icon: Images, href: "/admin/content/gallery" },
    { label: "Videos", value: videoCount, icon: Video, href: "/admin/content/videos" },
    { label: "Blog Posts", value: blogCount, icon: PenSquare, href: "/admin/content/blog" },
    { label: "Testimonials", value: testimonialCount, icon: MessageSquareQuote, href: "/admin/content/testimonials" },
    { label: "Offers", value: offerCount, icon: BadgePercent, href: "/admin/content/offers" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-white/40">Your showroom&apos;s pulse, at a glance.</p>
      </div>

      {/* Growth stat tiles */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {heroStats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-white/8 bg-[#141413] p-6 transition-colors duration-300 hover:border-gold/30">
            <div className="flex items-center justify-between">
              <p className="text-sm text-white/45">{s.label}</p>
              <s.icon className="h-4 w-4 text-gold" />
            </div>
            <p className="mt-3 text-3xl font-bold tracking-tight">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        <div className="rounded-2xl border border-white/8 bg-[#141413] p-6 xl:col-span-3">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Leads — Last 14 Days</h2>
              <p className="mt-0.5 text-xs text-white/35">All sources</p>
            </div>
          </div>
          <LeadsChart data={chartData} />
        </div>

        <div className="rounded-2xl border border-white/8 bg-[#141413] p-6 xl:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-semibold">Recent Leads</h2>
            <Link href="/admin/leads" className="flex items-center gap-1 text-xs text-gold hover:underline">
              View all <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          {recentLeads.length === 0 ? (
            <p className="py-10 text-center text-sm text-white/30">No leads yet — they&apos;ll appear here the moment a form is submitted.</p>
          ) : (
            <ul className="divide-y divide-white/6">
              {recentLeads.map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{l.name}</p>
                    <p className="truncate text-xs text-white/35">{l.type} · {l.phone}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[0.65rem] font-semibold ${statusStyles[l.status] ?? statusStyles.NEW}`}>
                    {l.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Content at a glance */}
      <div>
        <h2 className="mb-4 font-semibold">Content at a Glance</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
          {contentStats.map((s) => (
            <Link key={s.label} href={s.href} className="rounded-xl border border-white/8 bg-[#141413] p-4 transition-colors hover:border-gold/30">
              <s.icon className="mb-2 h-4 w-4 text-gold" />
              <p className="text-xl font-bold">{s.value}</p>
              <p className="text-xs text-white/40">{s.label}</p>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Recent activity */}
        <div className="rounded-2xl border border-white/8 bg-[#141413] p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold"><Activity className="h-4 w-4 text-gold" /> Recent Activity</h2>
            <Link href="/admin/logs" className="flex items-center gap-1 text-xs text-gold hover:underline">
              View all <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          {recentLogs.length === 0 ? (
            <p className="py-10 text-center text-sm text-white/30">No activity recorded yet.</p>
          ) : (
            <ul className="divide-y divide-white/6">
              {recentLogs.map((log) => (
                <li key={log.id} className="flex items-center justify-between gap-4 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate font-mono text-xs text-gold">{log.action}</p>
                    <p className="truncate text-xs text-white/35">{log.user?.name ?? "System"}</p>
                  </div>
                  <span className="shrink-0 text-xs text-white/30">
                    {new Date(log.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Analytics placeholder */}
        <div className="rounded-2xl border border-white/8 bg-[#141413] p-6">
          <h2 className="mb-5 flex items-center gap-2 font-semibold"><BarChart3 className="h-4 w-4 text-gold" /> Traffic & Conversion</h2>
          <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
            <p className="text-sm text-white/40">Visitor and page-view analytics require Google Analytics 4.</p>
            <Link href="/admin/settings" className="text-xs font-medium text-gold hover:underline">
              Connect GA4 in Settings →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
