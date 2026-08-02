import { requirePermission } from "@/lib/rbac";
import { Plus } from "lucide-react";


export const dynamic = "force-dynamic";
export const metadata = { title: "Coupons & Discounts" };

const dummyCoupons = [
  { code: "PRESTIGE10", type: "Percentage", value: "10% OFF", minOrder: "₹50,000", usage: "142 / 500", status: "Active", expires: "2026-12-31" },
  { code: "ARCHITECT15", type: "Percentage", value: "15% OFF", minOrder: "₹2,000", usage: "89 / 200", status: "Active", expires: "2026-10-30" },
  { code: "FESTIVE5000", type: "Fixed Amount", value: "₹5,000 OFF", minOrder: "₹1,00,000", usage: "45 / 100", status: "Active", expires: "2026-09-15" },
];

export default async function AdminCouponsPage() {
  await requirePermission("coupons", "view");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Coupons & Promotional Discounts</h1>
          <p className="mt-1 text-sm text-white/40">
            Create promotional coupon codes, minimum order requirements, and expiration rules.
          </p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-xl bg-gold px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-black hover:bg-gold-hover transition-colors">
          <Plus className="h-4 w-4" /> Create Coupon Code
        </button>
      </div>

      <div className="rounded-2xl border border-white/8 bg-[#141413] p-6 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-white/70">
            <thead className="border-b border-white/8 text-[11px] uppercase tracking-wider text-white/40">
              <tr>
                <th className="py-3 px-4">Coupon Code</th>
                <th className="py-3 px-4">Discount Value</th>
                <th className="py-3 px-4">Min Order Value</th>
                <th className="py-3 px-4">Usage Count</th>
                <th className="py-3 px-4">Expiry Date</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {dummyCoupons.map((c) => (
                <tr key={c.code} className="hover:bg-white/5 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-gold">{c.code}</td>
                  <td className="py-3.5 px-4 font-semibold text-white">{c.value} ({c.type})</td>
                  <td className="py-3.5 px-4 text-white/80">{c.minOrder}</td>
                  <td className="py-3.5 px-4 text-white/70">{c.usage}</td>
                  <td className="py-3.5 px-4 text-white/40">{c.expires}</td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
