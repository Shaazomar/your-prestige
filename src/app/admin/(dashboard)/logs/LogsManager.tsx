"use client";

import { useEffect, useState } from "react";
import { Eye, Download } from "lucide-react";
import { useAdminList } from "@/hooks/useAdminList";
import { AdminDataTable, type Column } from "@/components/admin/AdminDataTable";
import { LogDetail } from "./LogDetail";
import { listAuditLogs, listDistinctEntities, exportAuditLogsCsv, type AuditLogRow } from "./actions";

export function LogsManager() {
  const [entityFilter, setEntityFilter] = useState("");
  const list = useAdminList<AuditLogRow>(
    (params) => listAuditLogs({ ...params, entity: entityFilter || undefined }),
    { initialSortBy: "createdAt", initialSortDir: "desc" }
  );
  const [entities, setEntities] = useState<string[]>([]);
  const [viewing, setViewing] = useState<AuditLogRow | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    listDistinctEntities().then(setEntities);
  }, []);

  async function handleExport() {
    setExporting(true);
    try {
      const csv = await exportAuditLogsCsv();
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  const columns: Column<AuditLogRow>[] = [
    { key: "action", label: "Action", render: (row) => <span className="font-mono text-xs text-gold">{row.action}</span> },
    { key: "entity", label: "Entity", render: (row) => <span className="text-white/60">{row.entity ?? "—"}</span> },
    { key: "user", label: "User", render: (row) => <span className="text-white/60">{row.user?.name ?? "System"}</span> },
    { key: "ipAddress", label: "IP", render: (row) => <span className="font-mono text-xs text-white/40">{row.ipAddress ?? "—"}</span> },
    { key: "createdAt", label: "When", sortable: true, render: (row) => <span className="text-white/50">{new Date(row.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</span> },
  ];

  return (
    <>
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
        getId={(row) => row.id}
        trash={false}
        onTrashToggle={() => {}}
        hideTrashToggle
        emptyMessage="No activity recorded yet."
        searchPlaceholder="Search action, entity, user, IP…"
        rowActions={(row) => (
          <button onClick={() => setViewing(row)} aria-label="View details" className="rounded-lg p-1.5 text-white/40 hover:bg-white/8 hover:text-white">
            <Eye className="h-3.5 w-3.5" />
          </button>
        )}
        toolbar={
          <div className="ml-auto flex items-center gap-2">
            <select
              value={entityFilter}
              onChange={(e) => { setEntityFilter(e.target.value); list.setPage(1); }}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-gold"
            >
              <option value="">All Entities</option>
              {entities.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
            <button onClick={handleExport} disabled={exporting} className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-white/70 transition-colors hover:border-gold hover:text-gold disabled:opacity-50">
              <Download className="h-4 w-4" />
              {exporting ? "Exporting…" : "Export CSV"}
            </button>
          </div>
        }
      />

      <LogDetail log={viewing} onClose={() => setViewing(null)} />
    </>
  );
}
