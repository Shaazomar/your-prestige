import { requirePermission } from "@/lib/rbac";


export const dynamic = "force-dynamic";
export const metadata = { title: "B2B Quotes & Enquiries" };

const dummyQuotes = [
  { id: "QTE-2026-101", client: "Matrix Architects", contact: "Ar. Rajesh Verma", product: "Carrara Lumina Slab (120x240cm)", area: "4,500 Sq.Ft", status: "Pending Review", assignedTo: "Unassigned", date: "2026-08-02" },
  { id: "QTE-2026-102", client: "Sobha Developers", contact: "Anil Kulkarni", product: "Basalt Noir Matte (60x120cm)", area: "12,000 Sq.Ft", status: "Approved", assignedTo: "Sanjay Kumar", date: "2026-08-01" },
  { id: "QTE-2026-103", client: "Oberoi Luxury Suites", contact: "Neha Kapadia", product: "Travertine Classico", area: "8,200 Sq.Ft", status: "Converted to Order", assignedTo: "Sanjay Kumar", date: "2026-07-29" },
  { id: "QTE-2026-104", client: "Prestige Villas", contact: "Vikram Shetty", product: "Sanitaryware Suite", area: "24 Bathrooms", status: "Sample Dispatched", assignedTo: "Pooja Hegde", date: "2026-07-25" },
];

export default async function AdminQuotesPage() {
  await requirePermission("quotes", "view");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">B2B Quote Requests</h1>
        <p className="mt-1 text-sm text-white/40">
          Manage architect quotation inquiries, sample box requests, and sales assignments.
        </p>
      </div>

      <div className="rounded-2xl border border-white/8 bg-[#141413] p-6 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-white/70">
            <thead className="border-b border-white/8 text-[11px] uppercase tracking-wider text-white/40">
              <tr>
                <th className="py-3 px-4">Quote Ref</th>
                <th className="py-3 px-4">Client Firm</th>
                <th className="py-3 px-4">Requested Surface</th>
                <th className="py-3 px-4">Project Quantity</th>
                <th className="py-3 px-4">Assigned Manager</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {dummyQuotes.map((q) => (
                <tr key={q.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-3.5 px-4 font-mono text-gold font-bold">{q.id}</td>
                  <td className="py-3.5 px-4">
                    <p className="font-semibold text-white">{q.client}</p>
                    <p className="text-[10px] text-white/40">{q.contact}</p>
                  </td>
                  <td className="py-3.5 px-4 text-white/80">{q.product}</td>
                  <td className="py-3.5 px-4 font-bold text-white">{q.area}</td>
                  <td className="py-3.5 px-4 text-white/60">{q.assignedTo}</td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center rounded-full bg-gold/15 border border-gold/30 px-2.5 py-0.5 text-[10px] font-bold text-gold">
                      {q.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-white/40">{q.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
