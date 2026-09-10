import { Building2 } from "lucide-react";
import { requirePermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dealer & Franchise Network" };

/**
 * Reads the real Dealer table. This screen used to render a hard-coded array
 * of four invented dealers — names, GST numbers and approved credit limits
 * that looked like production records and were not.
 */
export default async function AdminDealersPage() {
  await requirePermission("dealers", "view");

  const dealers = await prisma.dealer.findMany({
    orderBy: [{ status: "asc" }, { name: "asc" }],
    take: 200,
    include: { _count: { select: { stockBlocks: true, stockBookings: true } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dealer & Franchise Network</h1>
        <p className="mt-1 text-sm text-white/40">
          Authorized Prestige B2B channel partners registered in the depot database.
        </p>
      </div>

      <div className="rounded-2xl border border-white/8 bg-[#141413] p-6 space-y-4">
        {dealers.length === 0 ? (
          <div className="flex flex-col items-center px-8 py-16 text-center">
            <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5">
              <Building2 className="h-5 w-5 text-white/35" />
            </span>
            <p className="text-sm text-white/45">No dealers are registered yet.</p>
            <p className="mt-1 text-xs text-white/30">
              Dealer accounts are created in the depot application; they appear here as soon as they exist.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-white/70">
              <thead className="border-b border-white/8 text-[11px] uppercase tracking-wider text-white/40">
                <tr>
                  <th className="py-3 px-4">Business Name</th>
                  <th className="py-3 px-4">Company</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Blocks</th>
                  <th className="py-3 px-4">Bookings</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {dealers.map((d) => (
                  <tr key={d.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-white">{d.name}</td>
                    <td className="py-3.5 px-4 text-white/80">{d.company || "—"}</td>
                    <td className="py-3.5 px-4 text-white/70">{d.contact || "—"}</td>
                    <td className="py-3.5 px-4 font-mono text-white/60">{d.email || "—"}</td>
                    <td className="py-3.5 px-4 font-mono text-white/60">{d.phone || "—"}</td>
                    <td className="py-3.5 px-4 font-mono text-white/70">{d._count.stockBlocks}</td>
                    <td className="py-3.5 px-4 font-mono text-white/70">{d._count.stockBookings}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${
                          d.status === "ACTIVE"
                            ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                            : "bg-amber-500/15 text-amber-300 border-amber-500/30"
                        }`}
                      >
                        {d.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
