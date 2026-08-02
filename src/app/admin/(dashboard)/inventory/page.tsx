import { requirePermission } from "@/lib/rbac";
import { AlertTriangle, CheckCircle2, Box } from "lucide-react";
import { products } from "@/lib/catalog";


export const dynamic = "force-dynamic";
export const metadata = { title: "Inventory & Stock Levels" };

export default async function AdminInventoryPage() {
  await requirePermission("inventory", "view");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Inventory & Stock Tracking</h1>
        <p className="mt-1 text-sm text-white/40">
          Monitor real-time warehouse stock levels, batch/shade codes, and low stock reorder thresholds.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-white/8 bg-[#141413] p-5">
          <div className="flex items-center justify-between text-white/40 mb-2">
            <span className="text-xs uppercase tracking-wider font-semibold">Total SKUs Tracked</span>
            <Box className="h-4 w-4 text-gold" />
          </div>
          <p className="text-2xl font-bold text-white">{products.length}</p>
          <span className="text-xs text-white/40">Active catalog items</span>
        </div>
        <div className="rounded-2xl border border-white/8 bg-[#141413] p-5">
          <div className="flex items-center justify-between text-white/40 mb-2">
            <span className="text-xs uppercase tracking-wider font-semibold">In Stock Slabs</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-white">42,500 Sq.Ft</p>
          <span className="text-xs text-emerald-400 font-medium">Ready for dispatch</span>
        </div>
        <div className="rounded-2xl border border-white/8 bg-[#141413] p-5">
          <div className="flex items-center justify-between text-white/40 mb-2">
            <span className="text-xs uppercase tracking-wider font-semibold">Low Stock Warnings</span>
            <AlertTriangle className="h-4 w-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-white">2 SKUs</p>
          <span className="text-xs text-amber-400 font-medium">Below minimum threshold</span>
        </div>
      </div>

      <div className="rounded-2xl border border-white/8 bg-[#141413] p-6 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-white/70">
            <thead className="border-b border-white/8 text-[11px] uppercase tracking-wider text-white/40">
              <tr>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Stock Status</th>
                <th className="py-3 px-4">Available Qty</th>
                <th className="py-3 px-4">Reserved Qty</th>
                <th className="py-3 px-4">Batch / Shade</th>
                <th className="py-3 px-4">Min Threshold</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {products.map((p, idx) => (
                <tr key={p.slug} className="hover:bg-white/5 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-white">{p.name}</td>
                  <td className="py-3.5 px-4 text-white/60 capitalize">{p.category}</td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
                      In Stock
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-white">{1200 + idx * 350} Sq.Ft</td>
                  <td className="py-3.5 px-4 text-white/60">{150 + idx * 40} Sq.Ft</td>
                  <td className="py-3.5 px-4 font-mono text-gold">BT-2026-{A01 + idx}</td>
                  <td className="py-3.5 px-4 text-white/40">500 Sq.Ft</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
const A01 = 101;
