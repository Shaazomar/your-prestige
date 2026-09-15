"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { AlertTriangle, Play, RefreshCw, Check } from "lucide-react";
import { useAdminList } from "@/hooks/useAdminList";
import { AdminDataTable, type Column } from "@/components/admin/AdminDataTable";
import {
  listNeedsReview,
  getClassificationOptions,
  getClassificationStats,
  resolveClassification,
  runClassifier,
  type ReviewRow,
} from "./actions";

type Options = { categories: { id: string; name: string }[]; brands: { id: string; name: string }[] };
type Stats = Awaited<ReturnType<typeof getClassificationStats>>;

export function ClassificationManager({ canEdit }: { canEdit: boolean }) {
  const list = useAdminList<ReviewRow>(listNeedsReview, { pageSize: 24, initialSortBy: "classifiedAt" });
  const [options, setOptions] = useState<Options>({ categories: [], brands: [] });
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [, startTransition] = useTransition();

  const refreshStats = useCallback(() => {
    getClassificationStats()
      .then((s) => { setStats(s); setStatsError(null); })
      .catch((err: unknown) => setStatsError(err instanceof Error ? err.message : "Could not load counts"));
  }, []);

  useEffect(() => {
    getClassificationOptions().then(setOptions).catch(() => {});
    refreshStats();
  }, [refreshStats]);

  async function handleRun(apply: boolean) {
    setRunning(true);
    try {
      const report = await runClassifier(apply);
      toast.success(
        apply
          ? `Classified ${report.classified}; ${report.needsReview} flagged for review`
          : `Dry run: would classify ${report.classified}, flag ${report.needsReview}`
      );
      if (apply) { list.refresh(); refreshStats(); }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Classifier failed");
    } finally {
      setRunning(false);
    }
  }

  function assign(row: ReviewRow, field: "categoryId" | "brandId", value: string) {
    if (!value) return;
    startTransition(async () => {
      try {
        await resolveClassification(row.id, { [field]: value });
        toast.success(`"${row.name}" filed`);
        list.refresh();
        refreshStats();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not save");
      }
    });
  }

  const columns: Column<ReviewRow>[] = [
    {
      key: "name",
      label: "Product",
      render: (row) => (
        <div className="flex items-center gap-3">
          {row.thumbUrl ? (
            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-white/5">
              <Image src={row.thumbUrl} alt="" fill sizes="44px" className="object-cover" />
            </div>
          ) : (
            <div className="h-11 w-11 shrink-0 rounded-lg bg-white/5" />
          )}
          <div className="min-w-0">
            <p className="truncate font-medium text-white">{row.name}</p>
            <p className="truncate text-xs text-white/35">
              {row.sku || row.productCode || row.slug}
              {row.collection ? ` · ${row.collection}` : ""}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "why",
      label: "Why it needs review",
      render: (row) => (
        <span className="text-xs text-amber-300/80">{row.classificationNote ?? "—"}</span>
      ),
    },
    {
      key: "current",
      label: "Currently",
      render: (row) => (
        <div className="text-xs">
          <p className="text-white/70">{row.brandName ?? <span className="text-white/25">No brand</span>}</p>
          <p className="text-white/40">{row.categoryPath ?? <span className="text-white/25">No category</span>}</p>
        </div>
      ),
    },
    {
      key: "assign",
      label: "File it",
      render: (row) =>
        canEdit ? (
          <div className="flex flex-col gap-1.5">
            <select
              defaultValue=""
              onChange={(e) => assign(row, "categoryId", e.target.value)}
              className="w-48 rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-white outline-none focus:border-gold"
            >
              <option value="">Choose category…</option>
              {options.categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {!row.brandName && (
              <select
                defaultValue=""
                onChange={(e) => assign(row, "brandId", e.target.value)}
                className="w-48 rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-white outline-none focus:border-gold"
              >
                <option value="">Choose brand…</option>
                {options.brands.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            )}
          </div>
        ) : (
          <span className="text-xs text-white/25">View only</span>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Counts — every figure straight from the database. */}
      {statsError ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-200">
          Counts unavailable: <span className="font-mono text-xs">{statsError}</span>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-5">
          {[
            { label: "Products", value: stats?.total, tone: "text-white" },
            { label: "Reviewed by hand", value: stats?.manual, tone: "text-emerald-400" },
            { label: "Auto-classified", value: stats?.auto, tone: "text-blue-400" },
            { label: "Needs review", value: stats?.needsReview, tone: "text-amber-400" },
            { label: "No category yet", value: stats?.uncategorised, tone: "text-white/60" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-white/8 bg-[#141413] p-5">
              <p className="text-xs uppercase tracking-wider text-white/40">{s.label}</p>
              <p className={`mt-2 text-2xl font-bold tabular-nums ${s.tone}`}>
                {s.value?.toLocaleString("en-IN") ?? "—"}
              </p>
            </div>
          ))}
        </div>
      )}

      {canEdit && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/8 bg-[#141413] p-5">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
          <p className="flex-1 text-sm text-white/55">
            The classifier only fills products with no category, and never touches one a person has
            filed. Dry run first.
          </p>
          <button
            onClick={() => handleRun(false)}
            disabled={running}
            className="inline-flex items-center gap-2 rounded-xl border border-white/12 px-4 py-2 text-xs font-semibold text-white/75 transition-colors hover:border-gold hover:text-gold disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${running ? "animate-spin" : ""}`} /> Dry run
          </button>
          <button
            onClick={() => handleRun(true)}
            disabled={running}
            className="inline-flex items-center gap-2 rounded-xl bg-gold px-4 py-2 text-xs font-semibold text-ivory transition-colors hover:bg-gold-deep disabled:opacity-50"
          >
            <Play className="h-3.5 w-3.5" /> Run &amp; apply
          </button>
        </div>
      )}

      <AdminDataTable
        columns={columns}
        rows={list.rows}
        total={list.total}
        page={list.page}
        pageSize={list.pageSize}
        onPageChange={list.setPage}
        search={list.search}
        onSearchChange={list.setSearch}
        sortBy={list.sortBy}
        sortDir={list.sortDir}
        onSort={list.toggleSort}
        loading={list.loading}
        initialLoad={list.initialLoad}
        error={list.error}
        getId={(row) => row.id}
        trash={false}
        onTrashToggle={() => {}}
        hideTrashToggle
        emptyMessage="Nothing is waiting for review."
        searchPlaceholder="Search name, SKU or product code…"
      />

      {list.total === 0 && !list.loading && !list.error && (
        <p className="flex items-center justify-center gap-2 text-sm text-emerald-400/80">
          <Check className="h-4 w-4" /> Every product has been classified or reviewed.
        </p>
      )}
    </div>
  );
}
