"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, PlayCircle, Square, Wrench, Store } from "lucide-react";
import { listBrandsForImageCheck, checkBrandImages, repairMediaField } from "./actions";
import type { BrandImageCheckRow } from "@/lib/media/health-check";

const STATUS_TONE: Record<string, string> = {
  valid: "bg-emerald-500/15 text-emerald-300",
  missing: "bg-white/10 text-white/60",
  broken: "bg-red-500/15 text-red-300",
  unauthorized: "bg-amber-500/15 text-amber-300",
  unsupported: "bg-amber-500/15 text-amber-300",
};

/**
 * "Is this brand's photography actually live?" — the bulk, on-demand
 * counterpart to the structural scan above. That scan can only see that a
 * product's `lifestyleImage` column is non-empty; it can't tell a real S3
 * object from a well-formed key pointing at a file that was never uploaded.
 * Only an actual HTTP request can, and doing that for the whole catalogue on
 * every page load isn't viable — so this runs a brand at a time, on request,
 * in small batches with a visible running total.
 */
export function BrandImageChecker({ canEdit }: { canEdit: boolean }) {
  const [brands, setBrands] = useState<{ slug: string; name: string; productCount: number }[]>([]);
  const [brandSlug, setBrandSlug] = useState("");
  const [running, setRunning] = useState(false);
  const [checked, setChecked] = useState(0);
  const [total, setTotal] = useState(0);
  const [rows, setRows] = useState<BrandImageCheckRow[]>([]);
  const [repairing, setRepairing] = useState<string | null>(null);
  const [draftUrl, setDraftUrl] = useState("");
  const cancelRef = useRef(false);

  useEffect(() => {
    listBrandsForImageCheck().then((b) => {
      setBrands(b);
      if (b.length > 0) setBrandSlug(b[0].slug);
    }).catch(() => {});
  }, []);

  async function run() {
    if (!brandSlug) return;
    cancelRef.current = false;
    setRunning(true);
    setChecked(0);
    setTotal(0);
    setRows([]);

    try {
      let offset = 0;
      let nextOffset: number | null = 0;
      const collected: BrandImageCheckRow[] = [];

      while (nextOffset !== null) {
        if (cancelRef.current) break;
        const page = await checkBrandImages(brandSlug, offset);
        setTotal(page.total);
        collected.push(...page.rows);
        setRows([...collected]);
        setChecked(collected.length);
        nextOffset = page.nextOffset;
        offset = nextOffset ?? offset;
      }

      const broken = collected.filter((r) => r.status !== "valid").length;
      if (cancelRef.current) toast.info(`Stopped — checked ${collected.length} of ${total || collected.length}.`);
      else if (broken === 0) toast.success(`All ${collected.length} images verified live.`);
      else toast.warning(`${broken} of ${collected.length} images are not loading.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setRunning(false);
    }
  }

  function stop() {
    cancelRef.current = true;
  }

  async function handleRepair(row: BrandImageCheckRow) {
    const url = draftUrl.trim();
    if (!url) return;
    try {
      await repairMediaField("Product", row.productId, "lifestyleImage", url);
      toast.success(`Repaired ${row.name}`);
      setRows((prev) => prev.map((r) => (r.productId === row.productId ? { ...r, status: "valid", resolvedUrl: url } : r)));
      setRepairing(null);
      setDraftUrl("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Repair failed");
    }
  }

  const broken = rows.filter((r) => r.status !== "valid");

  return (
    <div className="space-y-4 rounded-2xl border border-white/8 bg-[#141413] p-5">
      <div className="flex items-start gap-3">
        <Store className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
        <div>
          <p className="text-sm font-semibold text-white">Verify a brand&apos;s photography</p>
          <p className="mt-1 text-sm text-white/50">
            Fetches every published product&apos;s image URL for the chosen brand and requests it for real —
            catching the case a structural scan can&apos;t: a perfectly well-formed image reference pointing at a
            file that was never actually uploaded.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={brandSlug}
          onChange={(e) => setBrandSlug(e.target.value)}
          disabled={running}
          className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-gold disabled:opacity-50"
        >
          {brands.map((b) => (
            <option key={b.slug} value={b.slug}>{b.name} ({b.productCount})</option>
          ))}
        </select>
        {running ? (
          <button
            onClick={stop}
            className="inline-flex items-center gap-2 rounded-xl border border-white/12 px-4 py-2 text-xs font-semibold text-white/75 hover:border-red-400 hover:text-red-300"
          >
            <Square className="h-3.5 w-3.5" /> Stop
          </button>
        ) : (
          <button
            onClick={run}
            disabled={!brandSlug}
            className="inline-flex items-center gap-2 rounded-xl bg-gold px-4 py-2 text-xs font-semibold text-ivory hover:bg-gold-deep disabled:opacity-50"
          >
            <PlayCircle className="h-3.5 w-3.5" /> Verify
          </button>
        )}
        {(running || total > 0) && (
          <span className="inline-flex items-center gap-1.5 text-xs text-white/50">
            {running && <Loader2 className="h-3 w-3 animate-spin" />}
            {checked} / {total || "…"} checked
          </span>
        )}
      </div>

      {rows.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {(["valid", "broken", "missing", "unauthorized", "unsupported"] as const).map((s) => {
            const count = rows.filter((r) => r.status === s).length;
            if (count === 0) return null;
            return (
              <div key={s} className={`rounded-xl px-3 py-2 text-center ${STATUS_TONE[s]}`}>
                <p className="text-lg font-bold tabular-nums">{count}</p>
                <p className="text-[10px] uppercase tracking-wider opacity-80">{s}</p>
              </div>
            );
          })}
        </div>
      )}

      {broken.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-white/8">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-xs uppercase tracking-wider text-white/40">
              <tr>
                <th className="px-3 py-2">Product</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Resolved URL</th>
                <th className="px-3 py-2">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {broken.map((row) => (
                <tr key={row.productId}>
                  <td className="px-3 py-2">
                    <p className="font-medium text-white">{row.name}</p>
                    <p className="text-xs text-white/35">{row.slug}</p>
                  </td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_TONE[row.status]}`}>
                      {row.status}{row.httpStatus ? ` · ${row.httpStatus}` : ""}
                    </span>
                  </td>
                  <td className="max-w-xs truncate px-3 py-2 font-mono text-xs text-white/50" title={row.resolvedUrl ?? ""}>
                    {row.resolvedUrl || <span className="text-white/25">(none)</span>}
                  </td>
                  <td className="px-3 py-2">
                    {!canEdit ? (
                      <span className="text-xs text-white/25">View only</span>
                    ) : repairing === row.productId ? (
                      <div className="flex items-center gap-2">
                        <input
                          autoFocus
                          value={draftUrl}
                          onChange={(e) => setDraftUrl(e.target.value)}
                          placeholder="https://…"
                          className="w-52 rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-white outline-none focus:border-gold"
                        />
                        <button onClick={() => handleRepair(row)} className="rounded-lg bg-gold px-3 py-1.5 text-xs font-semibold text-ivory hover:bg-gold-deep">
                          Save
                        </button>
                        <button onClick={() => { setRepairing(null); setDraftUrl(""); }} className="text-xs text-white/40 hover:text-white/70">
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setRepairing(row.productId); setDraftUrl(""); }}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-white/12 px-3 py-1.5 text-xs font-semibold text-white/75 hover:border-gold hover:text-gold"
                      >
                        <Wrench className="h-3.5 w-3.5" /> Repair
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
