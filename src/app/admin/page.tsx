import Link from "next/link";
import { Users2, CalendarClock, Sparkles, TrendingUp, ArrowUpRight } from "lucide-react";
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

  const [totalLeads, newLeads, visitBookings, recentLeads, chartLeads] =
    await Promise.all([
      prisma.lead.count(),
      prisma.lead.count({ where: { status: "NEW" } }),
      prisma.lead.count({ where: { type: "VISIT" } }),
      prisma.lead.findMany({ orderBy: { createdAt: "desc" }, take: 6 }),
      prisma.lead.findMany({
        where: { createdAt: { gte: since } },
        select: { createdAt: true },
      }),
    ]);

  // Bucket last 14 days
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    return d;
  });
  const chartData = days.map((d) => ({
    label: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
    count: chartLeads.filter(
      (l) => l.createdAt.toDateString() === d.toDateString()
    ).length,
  }));

  const conversion =
    totalLeads === 0
      ? 0
      : Math.round(((await prisma.lead.count({ where: { status: "WON" } })) / totalLeads) * 100);

  const stats = [
    { label: "Total Leads", value: totalLeads, icon: Users2 },
    { label: "New / Unattended", value: newLeads, icon: Sparkles },
    { label: "Visit Bookings", value: visitBookings, icon: CalendarClock },
    { label: "Win Rate", value: `${conversion}%`, icon: TrendingUp },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-white/40">
          Your showroom&apos;s pulse, at a glance.
        </p>
      </div>

      {/* Stat tiles */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-white/8 bg-[#141413] p-6 transition-colors duration-300 hover:border-gold/30"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-white/45">{s.label}</p>
              <s.icon className="h-4 w-4 text-gold" />
            </div>
            <p className="mt-3 text-3xl font-bold tracking-tight">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        {/* Chart */}
        <div className="rounded-2xl border border-white/8 bg-[#141413] p-6 xl:col-span-3">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Leads — Last 14 Days</h2>
              <p className="mt-0.5 text-xs text-white/35">All sources</p>
            </div>
          </div>
          <LeadsChart data={chartData} />
        </div>

        {/* Recent leads */}
        <div className="rounded-2xl border border-white/8 bg-[#141413] p-6 xl:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-semibold">Recent Leads</h2>
            <Link
              href="/admin/leads"
              className="flex items-center gap-1 text-xs text-gold hover:underline"
            >
              View all <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          {recentLeads.length === 0 ? (
            <p className="py-10 text-center text-sm text-white/30">
              No leads yet — they&apos;ll appear here the moment a form is submitted.
            </p>
          ) : (
            <ul className="divide-y divide-white/6">
              {recentLeads.map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{l.name}</p>
                    <p className="truncate text-xs text-white/35">
                      {l.type} · {l.phone}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[0.65rem] font-semibold ${statusStyles[l.status] ?? statusStyles.NEW}`}
                  >
                    {l.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
