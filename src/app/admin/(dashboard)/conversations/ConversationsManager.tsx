"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Eye, UserCheck, Download } from "lucide-react";
import { useAdminList } from "@/hooks/useAdminList";
import { AdminDataTable, type Column } from "@/components/admin/AdminDataTable";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { ConversationViewer } from "./ConversationViewer";
import { listConversations, softDeleteConversation, restoreConversation, exportConversationsCsv, type ConversationRow } from "./actions";

export function ConversationsManager({ permissions }: { permissions: { edit: boolean; delete: boolean } }) {
  const list = useAdminList<ConversationRow>(listConversations, { initialSortBy: "updatedAt", initialSortDir: "desc" });
  const [viewing, setViewing] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<ConversationRow | null>(null);
  const [exporting, setExporting] = useState(false);

  async function handleDelete() {
    if (!deleting) return;
    try {
      await softDeleteConversation(deleting.id);
      toast.success("Conversation moved to trash");
      list.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleting(null);
    }
  }

  async function handleRestore(row: ConversationRow) {
    try {
      await restoreConversation(row.id);
      toast.success("Conversation restored");
      list.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Restore failed");
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      const csv = await exportConversationsCsv();
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `conversations-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  }

  const columns: Column<ConversationRow>[] = [
    {
      key: "sessionId",
      label: "Session",
      render: (row) => (
        <div className="max-w-sm">
          <p className="truncate text-sm text-white">{row.preview}</p>
          <p className="text-xs text-white/30">{row.sessionId.slice(0, 12)}… · {row.messageCount} messages</p>
        </div>
      ),
    },
    {
      key: "updatedAt",
      label: "Last Active",
      sortable: true,
      render: (row) => <span className="text-white/60">{new Date(row.updatedAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</span>,
    },
    {
      key: "leadExtracted",
      label: "Lead",
      render: (row) => (row.leadExtracted ? <span className="flex items-center gap-1 text-xs text-emerald-300"><UserCheck className="h-3.5 w-3.5" /> Captured</span> : <span className="text-white/25">—</span>),
    },
    {
      key: "resolved",
      label: "Status",
      render: (row) => (
        <span className={row.resolved ? "rounded-full bg-emerald-400/15 px-2.5 py-1 text-xs font-medium text-emerald-300" : "rounded-full bg-gold/15 px-2.5 py-1 text-xs font-medium text-gold"}>
          {row.resolved ? "Resolved" : "Open"}
        </span>
      ),
    },
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
        trash={list.trash}
        onTrashToggle={list.setTrash}
        onDelete={permissions.delete ? (row) => setDeleting(row) : undefined}
        onRestore={permissions.edit ? handleRestore : undefined}
        emptyMessage={list.trash ? "Trash is empty." : "No concierge conversations yet."}
        searchPlaceholder="Search transcripts…"
        rowActions={(row) => (
          <button onClick={() => setViewing(row.id)} aria-label="View conversation" className="rounded-lg p-1.5 text-white/40 hover:bg-white/8 hover:text-white">
            <Eye className="h-3.5 w-3.5" />
          </button>
        )}
        toolbar={
          <button onClick={handleExport} disabled={exporting} className="ml-auto flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-white/70 transition-colors hover:border-gold hover:text-gold disabled:opacity-50">
            <Download className="h-4 w-4" />
            {exporting ? "Exporting…" : "Export CSV"}
          </button>
        }
      />

      <ConversationViewer id={viewing} onClose={() => setViewing(null)} onChanged={list.refresh} canEdit={permissions.edit} />

      <ConfirmDialog
        open={!!deleting}
        title="Move to trash?"
        description="This conversation transcript will be moved to trash."
        confirmLabel="Move to Trash"
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}
