"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, PlayCircle, Wrench, Search, Loader2, ShieldCheck } from "lucide-react";
import { scanMediaHealth, repairMediaField, verifyMediaHealthUrl } from "./actions";
import type { MediaIssue, MediaHealthStats } from "@/lib/media/health-check";
import { BrandImageChecker } from "./BrandImageChecker";

const STATUS_TONE: Record<string, string> = {
  missing: "bg-white/10 text-white/60",
  invalid: "bg-red-500/15 text-red-300",
  broken: "bg-red-500/15 text-red-300",
  unauthorized: "bg-amber-500/15 text-amber-300",
  unsupported: "bg-amber-500/15 text-amber-300",
};

export function MediaHealthManager({ canEdit }: { canEdit: boolean }) {
  const [issues, setIssues] = useState<MediaIssue[] | null>(null);
  const [stats, setStats] = useState<MediaHealthStats | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [entityFilter, setEntityFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [repairing, setRepairing] = useState<string | null>(null);
  const [draftUrl, setDraftUrl] = useState("");

  const [checkUrl, setCheckUrl] = useState("");
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<Awaited<ReturnType<typeof verifyMediaHealthUrl>> | null>(null);

  async function runScan() {
    setScanning(true);
    setScanError(null);
    try {
      const result = await scanMediaHealth();
      setIssues(result.issues);
      setStats(result.stats);
      if (result.issues.length === 0) toast.success("No structural media problems found.");
      else toast.warning(`${result.issues.length} media reference${result.issues.length === 1 ? "" : "s"} need attention.`);
    } catch (err) {
      setScanError(err instanceof Error ? err.message : "Scan failed");
    } finally {
      setScanning(false);
    }
  }

  async function handleCheckUrl() {
    const url = checkUrl.trim();
    if (!url) return;
    setChecking(true);
    setCheckResult(null);
    try {
      setCheckResult(await verifyMediaHealthUrl(url));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Check failed");
    } finally {
      setChecking(false);
    }
  }

  function rowKey(issue: MediaIssue) {
    return `${issue.entity}:${issue.entityId}:${issue.field}`;
  }

  async function handleRepair(issue: MediaIssue) {
    const url = draftUrl.trim();
    if (!url) return;
    try {
      await repairMediaField(issue.entity, issue.entityId, issue.field, url);
      toast.success(`Repaired ${issue.entity} · ${issue.field}`);
      setIssues((prev) => prev?.filter((i) => rowKey(i) !== rowKey(issue)) ?? null);
      setRepairing(null);
      setDraftUrl("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Repair failed");
    }
  }

  const filtered = useMemo(() => {
    if (!issues) return [];
    const q = search.trim().toLowerCase();
    return issues.filter((i) => {
      if (entityFilter !== "ALL" && i.entity !== entityFilter) return false;
      if (!q) return true;
      return (
        i.entityLabel.toLowerCase().includes(q) ||
        i.field.toLowerCase().includes(q) ||
        (i.storedValue ?? "").toLowerCase().includes(q)
      );
    });
  }, [issues, entityFilter, search]);

  const entities = useMemo(
    () => Array.from(new Set((issues ?? []).map((i) => i.entity))).sort(),
    [issues]
  );

  return (
    <div className="space-y-6">
      {/* Live URL checker — the on-demand counterpart to the structural scan below. */}
      <div className="rounded-2xl border border-white/8 bg-[#141413] p-5">
        <p className="text-xs uppercase tracking-wider text-white/40">Check one URL live</p>
        <p className="mt-1 text-sm text-white/50">
          Structurally-sound doesn&apos;t mean reachable — paste a resolved image/video URL to fetch it and
          confirm it actually loads (status, auth, content type).
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            value={checkUrl}
            onChange={(e) => setCheckUrl(e.target.value)}
            placeholder="https://…"
            className="min-w-[20rem] flex-1 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-gold"
          />
          <button
            onClick={handleCheckUrl}
            disabled={checking || !checkUrl.trim()}
            className="inline-flex items-center gap-2 rounded-xl bg-gold px-4 py-2 text-xs font-semibold text-ivory transition-colors hover:bg-gold-deep disabled:opacity-50"
          >
            {checking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />} Check
          </button>
        </div>
        {checkResult && (
          <p className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${STATUS_TONE[checkResult.status] ?? "bg-emerald-500/15 text-emerald-300"}`}>
            {checkResult.status.toUpperCase()}
            {checkResult.httpStatus ? ` · HTTP ${checkResult.httpStatus}` : ""}
            {checkResult.error ? ` · ${checkResult.error}` : ""}
          </p>
        )}
      </div>

      <BrandImageChecker canEdit={canEdit} />

      {/* Structural scan */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/8 bg-[#141413] p-5">
        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
        <p className="flex-1 text-sm text-white/55">
          Scans every published Product, Brand, Category, Collection, Showroom and About-page person for a
          primary image that is missing or that can&apos;t be resolved to a loadable URL, plus any garbage
          entries in a gallery. No network requests — database only, so it&apos;s safe to run any time.
        </p>
        <button
          onClick={runScan}
          disabled={scanning}
          className="inline-flex items-center gap-2 rounded-xl bg-gold px-4 py-2 text-xs font-semibold text-ivory transition-colors hover:bg-gold-deep disabled:opacity-50"
        >
          {scanning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PlayCircle className="h-3.5 w-3.5" />}
          {scanning ? "Scanning…" : "Run scan"}
        </button>
      </div>

      {scanError && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-200">
          Scan failed: <span className="font-mono text-xs">{scanError}</span>
        </div>
      )}

      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-white/8 bg-[#141413] p-5">
            <p className="text-xs uppercase tracking-wider text-white/40">Total flagged</p>
            <p className="mt-2 text-2xl font-bold tabular-nums text-white">{stats.total.toLocaleString("en-IN")}</p>
          </div>
          {Object.entries(stats.byStatus).map(([status, count]) => (
            <div key={status} className="rounded-2xl border border-white/8 bg-[#141413] p-5">
              <p className="text-xs uppercase tracking-wider text-white/40">{status}</p>
              <p className="mt-2 text-2xl font-bold tabular-nums text-amber-400">{count.toLocaleString("en-IN")}</p>
            </div>
          ))}
        </div>
      )}

      {issues && issues.length > 0 && (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[16rem]">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/30" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search entity name, field or stored value…"
                className="w-full rounded-lg border border-white/10 bg-black/40 py-2 pl-9 pr-3 text-sm text-white outline-none focus:border-gold"
              />
            </div>
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-gold"
            >
              <option value="ALL">All entities ({issues.length})</option>
              {entities.map((e) => (
                <option key={e} value={e}>{e} ({issues.filter((i) => i.entity === e).length})</option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-white/8">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 text-xs uppercase tracking-wider text-white/40">
                <tr>
                  <th className="px-4 py-3">Entity</th>
                  <th className="px-4 py-3">Field</th>
                  <th className="px-4 py-3">Stored value</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((issue) => {
                  const key = rowKey(issue);
                  return (
                    <tr key={key}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-white">{issue.entityLabel}</p>
                        <p className="text-xs text-white/35">{issue.entity}</p>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-white/60">{issue.field}</td>
                      <td className="max-w-xs truncate px-4 py-3 font-mono text-xs text-white/50" title={issue.storedValue ?? ""}>
                        {issue.storedValue || <span className="text-white/25">(empty)</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_TONE[issue.status]}`}>
                          {issue.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {!canEdit || !issue.repairable ? (
                          <span className="text-xs text-white/25">
                            {issue.repairable ? "View only" : "Edit in record"}
                          </span>
                        ) : repairing === key ? (
                          <div className="flex items-center gap-2">
                            <input
                              autoFocus
                              value={draftUrl}
                              onChange={(e) => setDraftUrl(e.target.value)}
                              placeholder="https://… or /uploads/…"
                              className="w-56 rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-white outline-none focus:border-gold"
                            />
                            <button
                              onClick={() => handleRepair(issue)}
                              className="rounded-lg bg-gold px-3 py-1.5 text-xs font-semibold text-ivory hover:bg-gold-deep"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => { setRepairing(null); setDraftUrl(""); }}
                              className="text-xs text-white/40 hover:text-white/70"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setRepairing(key); setDraftUrl(""); }}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-white/12 px-3 py-1.5 text-xs font-semibold text-white/75 hover:border-gold hover:text-gold"
                          >
                            <Wrench className="h-3.5 w-3.5" /> Repair
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {issues && issues.length === 0 && !scanning && (
        <p className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 text-center text-sm text-emerald-300">
          No structural media problems found in the last scan.
        </p>
      )}
    </div>
  );
}
