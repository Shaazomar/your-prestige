import { requirePermission } from "@/lib/rbac";
import { Plus } from "lucide-react";


export const dynamic = "force-dynamic";
export const metadata = { title: "Attributes & Product Specifications" };

const dummyAttributes = [
  { id: "ATTR-01", name: "Surface Finish", type: "Select", values: ["Polished High Gloss", "Honed Matte", "Carving Finish", "Satin Velvet", "Book-matched Gloss"] },
  { id: "ATTR-02", name: "Slab Thickness", type: "Select", values: ["6mm", "9mm", "12mm (Ultra-compact)", "15mm", "20mm Paver"] },
  { id: "ATTR-03", name: "Water Absorption", type: "Numeric Range", values: ["< 0.05% (Vitrified)", "< 0.5% (Porcelain)", "< 3.0% (Ceramic)"] },
  { id: "ATTR-04", name: "PEI Abrasion Rating", type: "Scale (1-5)", values: ["Class 3 (Residential)", "Class 4 (Heavy Commercial)", "Class 5 (Airport / Mall)"] },
  { id: "ATTR-05", name: "Slip Resistance", type: "R Rating", values: ["R9 (Indoor)", "R10 (Bathroom)", "R11 (Outdoor Pool Deck)"] },
  { id: "ATTR-06", name: "Edge Finish", type: "Select", values: ["Rectified Monocaliber", "Chiseled Rustic", "Beveled Edge", "Bullnose"] },
];

export default async function AdminAttributesPage() {
  await requirePermission("attributes", "view");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Attributes & Specifications Builder</h1>
          <p className="mt-1 text-sm text-white/40">
            Define dynamic product attributes, technical test parameters, and specification filters.
          </p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-xl bg-gold px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-black hover:bg-gold-hover transition-colors shadow-soft">
          <Plus className="h-4 w-4" /> Add Attribute
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {dummyAttributes.map((attr) => (
          <div key={attr.id} className="rounded-2xl border border-white/8 bg-[#141413] p-6 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase text-gold">{attr.id}</span>
                <h3 className="text-lg font-bold text-white mt-0.5">{attr.name}</h3>
              </div>
              <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-semibold text-white/70">
                {attr.type}
              </span>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              {attr.values.map((val) => (
                <span key={val} className="rounded-lg bg-white/5 border border-white/10 px-3 py-1 text-xs text-white/80">
                  {val}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
