import { BarChart3, Globe2, Smartphone, Radio } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";

export const dynamic = "force-dynamic";
export const metadata = { title: "Analytics" };

const statusOrder = ["NEW", "CONTACTED", "QUALIFIED", "VISITED", "QUOTED", "WON", "LOST"] as const;

export default async function AnalyticsPage() {
  await requirePermission("analytics", "view");

  const [bySource, byStatus, byType, totalLeads] = await Promise.all([
    prisma.lead.groupBy({ by: ["source"], _count: true, where: { deletedAt: null } }),
    prisma.lead.groupBy({ by: ["status"], _count: true, where: { deletedAt: null } }),
    prisma.lead.groupBy({ by: ["type"], _count: true, where: { deletedAt: null } }),
    prisma.lead.count({ where: { deletedAt: null } }),
  ]);

  const statusMap = Object.fromEntries(byStatus.map((s) => [s.status, s._count]));
  const maxStatusCount = Math.max(1, ...byStatus.map((s) => s._count));
  const ga4Configured = !!(process.env.GA4_PROPERTY_ID && process.env.GOOGLE_ANALYTICS_SERVICE_ACCOUNT_JSON);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="mt-1 text-sm text-white/40">Lead and conversion analytics are live now; traffic metrics need Google Analytics 4.</p>
      </div>

      {/* Conversion funnel — real data */}
      <div className="rounded-2xl border border-white/8 bg-[#141413] p-6">
        <h2 className="mb-6 font-semibold">Lead Conversion Funnel</h2>
        <div className="space-y-3">
          {statusOrder.map((status) => {
            const count = statusMap[status] ?? 0;
            const pct = totalLeads === 0 ? 0 : Math.round((count / totalLeads) * 100);
            return (
              <div key={status}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-white/60">{status}</span>
                  <span className="text-white/40">{count} ({pct}%)</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/5">
                  <div className="h-full rounded-full bg-gold" style={{ width: `${(count / maxStatusCount) * 100}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/8 bg-[#141413] p-6">
          <h2 className="mb-4 font-semibold">Leads by Source</h2>
          <ul className="space-y-2.5">
            {bySource.length === 0 && <p className="text-sm text-white/30">No leads yet.</p>}
            {bySource.map((s) => (
              <li key={s.source ?? "unknown"} className="flex items-center justify-between text-sm">
                <span className="capitalize text-white/60">{s.source ?? "Unknown"}</span>
                <span className="font-medium text-white">{s._count}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-white/8 bg-[#141413] p-6">
          <h2 className="mb-4 font-semibold">Leads by Type</h2>
          <ul className="space-y-2.5">
            {byType.map((t) => (
              <li key={t.type} className="flex items-center justify-between text-sm">
                <span className="text-white/60">{t.type}</span>
                <span className="font-medium text-white">{t._count}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* GA4-dependent metrics */}
      <div className="rounded-2xl border border-white/8 bg-[#141413] p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-semibold"><BarChart3 className="h-4 w-4 text-gold" /> Traffic Metrics</h2>
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${ga4Configured ? "bg-emerald-400/15 text-emerald-300" : "bg-white/8 text-white/40"}`}>
            {ga4Configured ? "GA4 Connected" : "GA4 Not Connected"}
          </span>
        </div>
        {ga4Configured ? (
          <p className="text-sm text-white/40">GA4 credentials detected — live reporting integration is the next step (Analytics Data API wiring).</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-dashed border-white/10 p-5 text-center">
              <Globe2 className="mx-auto mb-2 h-5 w-5 text-white/20" />
              <p className="text-xs text-white/30">Top Pages & Countries</p>
            </div>
            <div className="rounded-xl border border-dashed border-white/10 p-5 text-center">
              <Smartphone className="mx-auto mb-2 h-5 w-5 text-white/20" />
              <p className="text-xs text-white/30">Device Breakdown</p>
            </div>
            <div className="rounded-xl border border-dashed border-white/10 p-5 text-center">
              <Radio className="mx-auto mb-2 h-5 w-5 text-white/20" />
              <p className="text-xs text-white/30">Realtime Visitors</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
