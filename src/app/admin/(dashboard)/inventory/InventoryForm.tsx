"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AField, ASelect, ATextArea } from "@/components/admin/FormField";
import { updateInventory, getInventoryHistory, type InventoryRow } from "./actions";

interface HistoryItem {
  id: string;
  quantity: number;
  type: string;
  notes: string | null;
  createdAt: Date;
}

export function InventoryForm({
  row,
  onSuccess,
}: {
  row: InventoryRow;
  onSuccess: () => void;
}) {
  const inv = row.inventory;
  const [values, setValues] = useState({
    totalStock: inv?.totalStock ?? 0,
    availableStock: inv?.availableStock ?? 0,
    reservedStock: inv?.reservedStock ?? 0,
    damagedStock: inv?.damagedStock ?? 0,
    transitStock: inv?.transitStock ?? 0,
    minimumStock: inv?.minimumStock ?? 0,
    maximumStock: inv?.maximumStock ?? 0,
    stockStatus: inv?.stockStatus ?? "OUT_OF_STOCK",
    notes: "",
  });
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getInventoryHistory(row.id).then((data) => setHistory(data as HistoryItem[]));
  }, [row.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateInventory(row.id, values);
      toast.success("Inventory stock levels updated");
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Adjustment failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <AField
            label="Available Stock"
            type="number"
            value={values.availableStock}
            onChange={(e) => setValues((v) => ({ ...v, availableStock: Number(e.target.value) }))}
            required
            hint="Slabs/Boxes ready for immediate sale"
          />
          <AField
            label="Reserved Stock"
            type="number"
            value={values.reservedStock}
            onChange={(e) => setValues((v) => ({ ...v, reservedStock: Number(e.target.value) }))}
            required
            hint="Slabs reserved for active quotes"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <AField
            label="Damaged Stock"
            type="number"
            value={values.damagedStock}
            onChange={(e) => setValues((v) => ({ ...v, damagedStock: Number(e.target.value) }))}
            required
          />
          <AField
            label="Transit Stock"
            type="number"
            value={values.transitStock}
            onChange={(e) => setValues((v) => ({ ...v, transitStock: Number(e.target.value) }))}
            required
            hint="Incoming order slabs"
          />
          <AField
            label="Total Physical Stock"
            type="number"
            value={values.totalStock}
            onChange={(e) => setValues((v) => ({ ...v, totalStock: Number(e.target.value) }))}
            required
            hint="On-site total count"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <AField
            label="Min Stock Warning"
            type="number"
            value={values.minimumStock}
            onChange={(e) => setValues((v) => ({ ...v, minimumStock: Number(e.target.value) }))}
            required
          />
          <AField
            label="Max Capacity"
            type="number"
            value={values.maximumStock}
            onChange={(e) => setValues((v) => ({ ...v, maximumStock: Number(e.target.value) }))}
            required
          />
        </div>

        <ASelect
          label="Stock Status (Website Visibility)"
          value={values.stockStatus}
          onChange={(e) => setValues((v) => ({ ...v, stockStatus: e.target.value }))}
        >
          <option value="IN_STOCK">IN STOCK</option>
          <option value="LIMITED_STOCK">LIMITED STOCK</option>
          <option value="OUT_OF_STOCK">OUT OF STOCK</option>
          <option value="COMING_SOON">COMING SOON</option>
        </ASelect>

        <ATextArea
          label="Change Note / Reason"
          value={values.notes}
          onChange={(e) => setValues((v) => ({ ...v, notes: e.target.value }))}
          placeholder="e.g., Stock reconciliation / physical audit"
        />

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-xl bg-gold py-3 text-sm font-semibold text-ivory transition-colors hover:bg-gold-deep disabled:opacity-60"
        >
          {saving ? "Updating…" : "Update Stock Levels"}
        </button>
      </form>

      {/* History log */}
      <div className="border-t border-white/8 pt-5">
        <h4 className="text-sm font-medium text-white/70 mb-3">Stock Movement History</h4>
        {history.length === 0 ? (
          <p className="text-xs text-white/30">No inventory movements recorded yet.</p>
        ) : (
          <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
            {history.map((h) => (
              <div key={h.id} className="rounded-xl border border-white/8 bg-white/5 p-3 text-xs flex justify-between items-start gap-4">
                <div className="space-y-1">
                  <p className="font-semibold text-white/80">{h.type}</p>
                  <p className="text-white/40">{h.notes}</p>
                  <p className="text-[10px] text-white/25">
                    {new Date(h.createdAt).toLocaleDateString(undefined, {
                      dateStyle: "medium",
                    })}{" "}
                    {new Date(h.createdAt).toLocaleTimeString()}
                  </p>
                </div>
                <span className={`font-mono font-bold ${h.quantity >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {h.quantity >= 0 ? `+${h.quantity}` : h.quantity}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
