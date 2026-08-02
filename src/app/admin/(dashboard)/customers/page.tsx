import { requirePermission } from "@/lib/rbac";


export const dynamic = "force-dynamic";
export const metadata = { title: "Customers Directory" };

const dummyCustomers = [
  { id: "CUST-101", name: "Ananya Hegde", email: "ananya.hegde@gmail.com", phone: "+91 98450 12345", ordersCount: 4, ltv: "₹6,80,000", city: "Mangaluru", registeredDate: "2026-05-12" },
  { id: "CUST-102", name: "Dr. Vikram Rao", email: "vikram.rao@health.in", phone: "+91 98800 67890", ordersCount: 2, ltv: "₹14,20,000", city: "Bengaluru", registeredDate: "2026-06-04" },
  { id: "CUST-103", name: "Preeti Shenoy", email: "preeti.s@architects.com", phone: "+91 97411 22334", ordersCount: 7, ltv: "₹22,50,000", city: "Udupi", registeredDate: "2026-03-18" },
  { id: "CUST-104", name: "Karthik Bhat", email: "karthik.bhat@yahoo.com", phone: "+91 99002 55667", ordersCount: 1, ltv: "₹1,85,000", city: "Manipal", registeredDate: "2026-07-20" },
];

export default async function AdminCustomersPage() {
  await requirePermission("customers", "view");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Customers Directory</h1>
        <p className="mt-1 text-sm text-white/40">
          View customer accounts, lifetime value (LTV), order history, and saved wishlist items.
        </p>
      </div>

      <div className="rounded-2xl border border-white/8 bg-[#141413] p-6 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-white/70">
            <thead className="border-b border-white/8 text-[11px] uppercase tracking-wider text-white/40">
              <tr>
                <th className="py-3 px-4">Customer ID</th>
                <th className="py-3 px-4">Full Name</th>
                <th className="py-3 px-4">Contact Info</th>
                <th className="py-3 px-4">City</th>
                <th className="py-3 px-4">Completed Orders</th>
                <th className="py-3 px-4">Lifetime Value (LTV)</th>
                <th className="py-3 px-4">Member Since</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {dummyCustomers.map((c) => (
                <tr key={c.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-3.5 px-4 font-mono text-gold font-bold">{c.id}</td>
                  <td className="py-3.5 px-4 font-semibold text-white">{c.name}</td>
                  <td className="py-3.5 px-4">
                    <p className="text-white/90">{c.email}</p>
                    <p className="text-[10px] text-white/40">{c.phone}</p>
                  </td>
                  <td className="py-3.5 px-4 text-white/80">{c.city}</td>
                  <td className="py-3.5 px-4 font-bold text-white">{c.ordersCount} Orders</td>
                  <td className="py-3.5 px-4 font-bold text-gold">{c.ltv}</td>
                  <td className="py-3.5 px-4 text-white/40">{c.registeredDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
