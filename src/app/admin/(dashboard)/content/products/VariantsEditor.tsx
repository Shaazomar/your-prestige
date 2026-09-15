"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Layers } from "lucide-react";
import {
  listVariants,
  createVariant,
  updateVariant,
  deleteVariant,
  type VariantRow,
} from "./variant-actions";

const EMPTY = { sku: "", name: "", size: "", finish: "", color: "", unit: "" };

/**
 * Variants for one product.
 *
 * Only shown once the product exists — a variant needs a product to hang off,
 * so offering the editor while creating one would be a form that cannot save.
 */
export function VariantsEditor({ productId, canEdit }: { productId: string; canEdit: boolean }) {
  const [rows, setRows] = useState<VariantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [, startTransition] = useTransition();

  const refresh = useCallback(() => {
    setLoading(true);
    listVariants(productId)
      .then((r) => { setRows(r); setError(null); })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Could not load variants"))
      .finally(() => setLoading(false));
  }, [productId]);

  useEffect(refresh, [refresh]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await createVariant(productId, { ...draft, sortOrder: rows.length });
      setDraft({ ...EMPTY });
      toast.success("Variant added");
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add variant");
    } finally {
      setSaving(false);
    }
  }

  function toggleActive(row: VariantRow) {
    startTransition(async () => {
      try {
        await updateVariant(row.id, { ...row, active: !row.active });
        refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not update variant");
      }
    });
  }

  function remove(row: VariantRow) {
    if (!confirm(`Delete variant ${row.sku || row.name || "(unnamed)"}?`)) return;
    startTransition(async () => {
      try {
        await deleteVariant(row.id);
        toast.success("Variant deleted");
        refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not delete variant");
      }
    });
  }

  const field = "w-full rounded-lg border border-white/10 bg-black/40 px-2.5 py-1.5 text-xs text-white outline-none placeholder:text-white/25 focus:border-gold";

  return (
    <section className="space-y-4 border-t border-white/8 pt-6">
      <div className="flex items-center gap-2">
        <Layers className="h-4 w-4 text-gold" />
        <p className="text-eyebrow text-gold">Variants</p>
        <span className="text-xs text-white/35">{rows.length}</span>
      </div>
      <p className="text-xs text-white/35">
        Size, finish and colour versions of this product. Variants carry no stock — inventory stays
        against the product.
      </p>

      {error ? (
        <p className="rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2 text-xs text-red-300">
          {error}
        </p>
      ) : loading ? (
        <p className="text-xs text-white/30">Loading variants…</p>
      ) : rows.length === 0 ? (
        <p className="text-xs text-white/30">No variants yet.</p>
      ) : (
        <ul className="space-y-1.5">
          {rows.map((v) => (
            <li
              key={v.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-white">
                  {v.name || v.sku || "(unnamed)"}
                </p>
                <p className="truncate text-[11px] text-white/35">
                  {[v.sku, v.size, v.finish, v.color, v.unit].filter(Boolean).join(" · ") || "—"}
                </p>
              </div>
              {canEdit && (
                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => toggleActive(v)}
                    className={`rounded-lg px-2 py-1 text-[10px] font-bold uppercase ${
                      v.active ? "bg-emerald-500/15 text-emerald-300" : "bg-white/8 text-white/40"
                    }`}
                  >
                    {v.active ? "Active" : "Hidden"}
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(v)}
                    aria-label="Delete variant"
                    className="rounded-lg p-1.5 text-white/40 transition-colors hover:bg-red-500/10 hover:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {canEdit && (
        // A plain div, not a nested <form> — this sits inside the product form
        // and a nested form is invalid HTML that submits the wrong thing.
        <div className="grid grid-cols-3 gap-2 rounded-xl border border-white/8 bg-white/[0.02] p-3">
          <input className={field} placeholder="SKU" value={draft.sku}
            onChange={(e) => setDraft((d) => ({ ...d, sku: e.target.value }))} />
          <input className={field} placeholder="Name" value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} />
          <input className={field} placeholder="Size" value={draft.size}
            onChange={(e) => setDraft((d) => ({ ...d, size: e.target.value }))} />
          <input className={field} placeholder="Finish" value={draft.finish}
            onChange={(e) => setDraft((d) => ({ ...d, finish: e.target.value }))} />
          <input className={field} placeholder="Colour" value={draft.color}
            onChange={(e) => setDraft((d) => ({ ...d, color: e.target.value }))} />
          <input className={field} placeholder="Unit (Box/Piece)" value={draft.unit}
            onChange={(e) => setDraft((d) => ({ ...d, unit: e.target.value }))} />
          <button
            type="button"
            onClick={add}
            disabled={saving}
            className="col-span-3 inline-flex items-center justify-center gap-1.5 rounded-lg bg-white/8 py-2 text-xs font-semibold text-white/80 transition-colors hover:bg-white/12 disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" /> {saving ? "Adding…" : "Add variant"}
          </button>
        </div>
      )}
    </section>
  );
}
