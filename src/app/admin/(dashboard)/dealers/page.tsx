import { requirePermission } from "@/lib/rbac";


export const dynamic = "force-dynamic";
export const metadata = { title: "Dealer & Franchise Network" };

const dummyDealers = [
  { id: "DLR-001", businessName: "Coastal Tile World", city: "Mangaluru", gst: "29AAAAA0000A1Z5", tier: "Gold Dealer", status: "Verified Active", creditLimit: "₹50,00,000" },
  { id: "DLR-002", businessName: "Malabar Surface Hub", city: "Kozhikode", gst: "32BBBBB1111B2Z6", tier: "Platinum Franchise", status: "Verified Active", creditLimit: "₹1,20,000" },
  { id: "DLR-003", businessName: "Apex Building Materials", city: "Bengaluru", gst: "29CCCCC2222C3Z7", tier: "Standard Dealer", status: "Pending Verification", creditLimit: "₹25,00,000" },
  { id: "DLR-004", businessName: "Deccan Ceramics", city: "Hyderabad", gst: "36DDDDD3333D4Z8", tier: "Gold Dealer", status: "Verified Active", creditLimit: "₹75,00,000" },
];

export default async function AdminDealersPage() {
  await requirePermission("dealers", "view");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dealer & Franchise Network</h1>
        <p className="mt-1 text-sm text-white/40">
          Manage authorized Prestige B2B channel partners, credit limits, and franchise applications.
        </p>
      </div>

      <div className="rounded-2xl border border-white/8 bg-[#141413] p-6 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-white/70">
            <thead className="border-b border-white/8 text-[11px] uppercase tracking-wider text-white/40">
              <tr>
                <th className="py-3 px-4">Dealer ID</th>
                <th className="py-3 px-4">Business Name</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">GST Number</th>
                <th className="py-3 px-4">Tier / Category</th>
                <th className="py-3 px-4">Approved Credit</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {dummyDealers.map((d) => (
                <tr key={d.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-3.5 px-4 font-mono text-gold font-bold">{d.id}</td>
                  <td className="py-3.5 px-4 font-semibold text-white">{d.businessName}</td>
                  <td className="py-3.5 px-4 text-white/80">{d.city}</td>
                  <td className="py-3.5 px-4 font-mono text-white/60">{d.gst}</td>
                  <td className="py-3.5 px-4 text-gold font-medium">{d.tier}</td>
                  <td className="py-3.5 px-4 font-bold text-white">{d.creditLimit}</td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${d.status.includes("Active") ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" : "bg-amber-500/15 text-amber-300 border-amber-500/30"}`}>
                      {d.status}
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
