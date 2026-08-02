import { requirePermission } from "@/lib/rbac";
import { Star } from "lucide-react";


export const dynamic = "force-dynamic";
export const metadata = { title: "Product Reviews" };

const dummyReviews = [
  { id: "REV-101", product: "Carrara Lumina Slab", reviewer: "Ar. Rajesh Verma", rating: 5, comment: "Exquisite vein pattern and mirror polish. Used in a penthouse living room.", status: "Approved", date: "2026-08-01" },
  { id: "REV-102", product: "Basalt Noir Matte", reviewer: "Siddharth Menon", rating: 5, comment: "Tactile grip and deep dark tone. Looks spectacular in our outdoor patio.", status: "Approved", date: "2026-07-28" },
  { id: "REV-103", product: "Travertine Classico", reviewer: "Meera Nair", rating: 4, comment: "Very natural texture. Delivery was prompt and packaging was solid.", status: "Pending", date: "2026-07-25" },
];

export default async function AdminReviewsPage() {
  await requirePermission("reviews", "view");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Customer Product Reviews</h1>
        <p className="mt-1 text-sm text-white/40">
          Moderate product reviews, approve ratings, and feature verified architect testimonials.
        </p>
      </div>

      <div className="rounded-2xl border border-white/8 bg-[#141413] p-6 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-white/70">
            <thead className="border-b border-white/8 text-[11px] uppercase tracking-wider text-white/40">
              <tr>
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4">Reviewer</th>
                <th className="py-3 px-4">Rating</th>
                <th className="py-3 px-4">Review Comment</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {dummyReviews.map((r) => (
                <tr key={r.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-white">{r.product}</td>
                  <td className="py-3.5 px-4 text-white/90">{r.reviewer}</td>
                  <td className="py-3.5 px-4 text-gold font-bold flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-gold" /> {r.rating} / 5
                  </td>
                  <td className="py-3.5 px-4 text-white/80 max-w-sm">{r.comment}</td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${r.status === "Approved" ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" : "bg-amber-500/15 text-amber-300 border-amber-500/30"}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-white/40">{r.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
