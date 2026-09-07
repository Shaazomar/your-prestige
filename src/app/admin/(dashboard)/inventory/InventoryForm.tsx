"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AField, ASelect, ATextArea } from "@/components/admin/FormField";
import { updateInventory, getInventoryHistory, type InventoryRow } from "./actions";
import { STOCK_STATUSES, STOCK_STATUS_LABELS, normalizeStockStatus } from "@/lib/inventory-status";

interface HistoryItem {
  id: string;
  quantity: number;
  type: string;
  notes: string | null;
  createdAt: Date;
}

function safeStatus(value: string): string {
  try {
    return normalizeStockStatus(value);
  } catch {
    return "OUT_OF_STOCK";
  }
}

function formValues(row: InventoryRow) {
  const inv = row.inventory;
  return {
    totalStock: inv?.totalStock ?? 0,
    availableStock: inv?.availableStock ?? 0,
    reservedStock: inv?.reservedStock ?? 0,
    damagedStock: inv?.damagedStock ?? 0,
    transitStock: inv?.transitStock ?? 0,
    minimumStock: inv?.minimumStock ?? 0,
    maximumStock: inv?.maximumStock ?? 0,
    // Legacy rows may still hold the CMS's old vocabulary (IN_STOCK, …);
    // normalise so the select has something to match on.
    stockStatus: inv?.stockStatus ? safeStatus(inv.stockStatus) : "OUT_OF_STOCK",
    notes: "",
  };
}

export function InventoryForm({
  row,
  onSuccess,
}: {
  row: InventoryRow;
  onSuccess: () => void;
}) {
  const inv = row.inventory;
  const [values, setValues] = useState(() => formValues(row));
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Approving a block changes the stock behind an open drawer. Without this
  // resync the form still held the pre-approval numbers and writing them back
  // silently undid the approval's deduction.
  const invStamp = inv ? `${inv.id}:${new Date(inv.updatedAt).getTime()}` : "none";
  useEffect(() => {
    setValues(formValues(row));
    // Re-seed only when the underlying inventory row actually changed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invStamp]);

  useEffect(() => {
    let active = true;
    getInventoryHistory(row.id)
      .then((data) => {
        if (!active) return;
        setHistory(data as HistoryItem[]);
        setHistoryError(null);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setHistory([]);
        setHistoryError(err instanceof Error ? err.message : "Could not load stock history.");
      });
    return () => {
      active = false;
    };
  }, [row.id, invStamp]);

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
            min={0}
            value={values.availableStock}
            onChange={(e) => setValues((v) => ({ ...v, availableStock: Number(e.target.value) }))}
            required
            hint="Slabs/Boxes ready for immediate sale"
          />
          <AField
            label="Reserved Stock"
            type="number"
            min={0}
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
            min={0}
            value={values.damagedStock}
            onChange={(e) => setValues((v) => ({ ...v, damagedStock: Number(e.target.value) }))}
            required
          />
          <AField
            label="Transit Stock"
            type="number"
            min={0}
            value={values.transitStock}
            onChange={(e) => setValues((v) => ({ ...v, transitStock: Number(e.target.value) }))}
            required
            hint="Incoming order slabs"
          />
          <AField
            label="Total Physical Stock"
            type="number"
            min={0}
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
            min={0}
            value={values.minimumStock}
            onChange={(e) => setValues((v) => ({ ...v, minimumStock: Number(e.target.value) }))}
            required
          />
          <AField
            label="Max Capacity"
            type="number"
            min={0}
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
          {STOCK_STATUSES.map((status) => (
            <option key={status} value={status}>
              {STOCK_STATUS_LABELS[status]}
            </option>
          ))}
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
        {historyError ? (
          <p className="text-xs text-red-300">Stock history unavailable: {historyError}</p>
        ) : history.length === 0 ? (
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
