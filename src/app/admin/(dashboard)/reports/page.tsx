import { requirePermission } from "@/lib/rbac";
import { Download, Calendar } from "lucide-react";


export const dynamic = "force-dynamic";
export const metadata = { title: "Reports & Intelligence" };

export default async function AdminReportsPage() {
  await requirePermission("reports", "view");

  const reports = [
    { title: "Sales Revenue & Order Breakdown", desc: "Detailed monthly & quarterly revenue logs by category and dealer tier.", date: "Aug 2026", format: "Excel / PDF" },
    { title: "Product Velocity & Top Sellers", desc: "Performance report tracking catalog views, quote conversions, and sample requests.", date: "Aug 2026", format: "Excel / PDF" },
    { title: "Inventory Reorder & Valuation Report", desc: "Stock valuation across warehouses, batch aging, and low stock warnings.", date: "Aug 2026", format: "Excel / PDF" },
    { title: "Lookbook & Spec PDF Downloads Report", desc: "Architect downloads log by studio email and location.", date: "Aug 2026", format: "Excel / PDF" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Reports & Business Intelligence</h1>
          <p className="mt-1 text-sm text-white/40">
            Generate and export e-commerce sales reports, product performance, and catalog downloads.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reports.map((rep, idx) => (
          <div key={idx} className="rounded-2xl border border-white/8 bg-[#141413] p-6 space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-white/40 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-gold">{rep.format}</span>
                <Calendar className="h-4 w-4" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">{rep.title}</h3>
              <p className="text-xs text-white/50 leading-relaxed">{rep.desc}</p>
            </div>

            <button className="inline-flex items-center gap-2 rounded-xl border border-white/12 bg-white/5 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-gold hover:text-black transition-colors w-fit">
              <Download className="h-4 w-4" /> Export Report
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
