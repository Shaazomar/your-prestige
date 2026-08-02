import { requirePermission } from "@/lib/rbac";
import { ShoppingCart, Truck, CheckCircle2, Clock, Search, Filter } from "lucide-react";


export const dynamic = "force-dynamic";
export const metadata = { title: "Order Management" };

const dummyOrders = [
  { id: "ORD-2026-8801", customer: "Akash Sharma", email: "akash@example.com", total: "₹2,45,000", status: "Confirmed", items: "120 Sq.Ft Carrara Lumina Slab", date: "2026-08-02", payment: "Paid (UPI)" },
  { id: "ORD-2026-8802", customer: "Priya Varma", email: "priya@architects.in", total: "₹5,10,000", status: "Shipped", items: "350 Sq.Ft Basalt Noir Matte", date: "2026-08-01", payment: "Paid (NEFT)" },
  { id: "ORD-2026-8803", customer: "Kiran Builders", email: "procurement@kiran.com", total: "₹12,80,000", status: "Packed", items: "800 Sq.Ft Travertine Classico", date: "2026-07-31", payment: "50% Advance" },
  { id: "ORD-2026-8804", customer: "Rohan Nair", email: "rohan@nairdesign.com", total: "₹1,15,000", status: "Pending", items: "60 Sq.Ft Quartz Island Countertop", date: "2026-07-30", payment: "Pending" },
  { id: "ORD-2026-8805", customer: "Hotel Mirage", email: "purchase@hotelmirage.in", total: "₹18,50,000", status: "Delivered", items: "1,200 Sq.Ft Calacatta Gold Slabs", date: "2026-07-28", payment: "Paid (Bank Transfer)" },
];

const statusStyles: Record<string, string> = {
  Pending: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  Confirmed: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  Packed: "bg-purple-500/15 text-purple-300 border-purple-500/30",
  Shipped: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
  Delivered: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  Cancelled: "bg-rose-500/15 text-rose-300 border-rose-500/30",
};

export default async function AdminOrdersPage() {
  await requirePermission("orders", "view");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Order Management</h1>
          <p className="mt-1 text-sm text-white/40">
            Track customer retail & project order fulfillments, payment status, and dispatch tracking.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-white/8 bg-[#141413] p-5">
          <div className="flex items-center justify-between text-white/40 mb-2">
            <span className="text-xs uppercase tracking-wider font-semibold">Total Orders</span>
            <ShoppingCart className="h-4 w-4 text-gold" />
          </div>
          <p className="text-2xl font-bold text-white">48</p>
          <span className="text-xs text-emerald-400 font-medium">+12% vs last month</span>
        </div>
        <div className="rounded-2xl border border-white/8 bg-[#141413] p-5">
          <div className="flex items-center justify-between text-white/40 mb-2">
            <span className="text-xs uppercase tracking-wider font-semibold">Pending Fulfillment</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-white">6</p>
          <span className="text-xs text-white/40">Requires packing</span>
        </div>
        <div className="rounded-2xl border border-white/8 bg-[#141413] p-5">
          <div className="flex items-center justify-between text-white/40 mb-2">
            <span className="text-xs uppercase tracking-wider font-semibold">In Transit</span>
            <Truck className="h-4 w-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-white">14</p>
          <span className="text-xs text-white/40">Out for delivery</span>
        </div>
        <div className="rounded-2xl border border-white/8 bg-[#141413] p-5">
          <div className="flex items-center justify-between text-white/40 mb-2">
            <span className="text-xs uppercase tracking-wider font-semibold">Total Revenue</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-white">₹40,00,000</p>
          <span className="text-xs text-emerald-400 font-medium">Aug 2026</span>
        </div>
      </div>

      {/* Orders Table Container */}
      <div className="rounded-2xl border border-white/8 bg-[#141413] p-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-white/40" />
            <input
              type="text"
              placeholder="Search by order ID, customer..."
              className="w-full rounded-xl border border-white/12 bg-white/5 pl-9 pr-4 py-2 text-xs text-white placeholder:text-white/30 focus:border-gold focus:outline-none"
            />
          </div>
          <button className="flex items-center gap-2 rounded-xl border border-white/12 px-4 py-2 text-xs text-white/70 hover:text-white hover:border-gold transition-colors">
            <Filter className="h-3.5 w-3.5" /> Filter Orders
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-white/70">
            <thead className="border-b border-white/8 text-[11px] uppercase tracking-wider text-white/40">
              <tr>
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Items Summary</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {dummyOrders.map((ord) => (
                <tr key={ord.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-3.5 px-4 font-mono text-gold font-bold">{ord.id}</td>
                  <td className="py-3.5 px-4">
                    <p className="font-semibold text-white">{ord.customer}</p>
                    <p className="text-[10px] text-white/40">{ord.email}</p>
                  </td>
                  <td className="py-3.5 px-4 text-white/80">{ord.items}</td>
                  <td className="py-3.5 px-4 font-bold text-white">{ord.total}</td>
                  <td className="py-3.5 px-4 text-white/60">{ord.payment}</td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${statusStyles[ord.status] || "bg-white/10 text-white"}`}>
                      {ord.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-white/40">{ord.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
