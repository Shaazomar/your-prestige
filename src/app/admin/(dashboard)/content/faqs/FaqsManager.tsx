"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { useAdminList } from "@/hooks/useAdminList";
import { AdminDataTable, type Column } from "@/components/admin/AdminDataTable";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Drawer } from "@/components/admin/Drawer";
import { FaqForm } from "./FaqForm";
import { listFaqs, softDeleteFaq, restoreFaq } from "./actions";
import type { Faq } from "@prisma/client";

export function FaqsManager({ permissions }: { permissions: { create: boolean; edit: boolean; delete: boolean } }) {
  const list = useAdminList<Faq>(listFaqs, { initialSortBy: "sortOrder", initialSortDir: "asc" });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Faq | null>(null);
  const [deleting, setDeleting] = useState<Faq | null>(null);

  function onFormSuccess() {
    setDrawerOpen(false);
    list.refresh();
  }

  async function handleDelete() {
    if (!deleting) return;
    try {
      await softDeleteFaq(deleting.id);
      toast.success("FAQ moved to trash");
      list.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleting(null);
    }
  }

  async function handleRestore(row: Faq) {
    try {
      await restoreFaq(row.id);
      toast.success("FAQ restored");
      list.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Restore failed");
    }
  }

  const columns: Column<Faq>[] = [
    {
      key: "question",
      label: "Question",
      sortable: true,
      render: (row) => (
        <div className="max-w-md">
          <p className="font-medium text-white">{row.question}</p>
          <p className="truncate text-xs text-white/35">{row.answer}</p>
        </div>
      ),
    },
    { key: "category", label: "Category", render: (row) => <span className="text-white/60">{row.category ?? "—"}</span> },
    { key: "sortOrder", label: "Order", sortable: true, render: (row) => <span className="text-white/60">{row.sortOrder}</span> },
    {
      key: "published",
      label: "Status",
      render: (row) => (
        <span className={row.published ? "rounded-full bg-emerald-400/15 px-2.5 py-1 text-xs font-medium text-emerald-300" : "rounded-full bg-white/8 px-2.5 py-1 text-xs font-medium text-white/40"}>
          {row.published ? "Published" : "Draft"}
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
        onEdit={permissions.edit ? (row) => { setEditing(row); setDrawerOpen(true); } : undefined}
        onDelete={permissions.delete ? (row) => setDeleting(row) : undefined}
        onRestore={permissions.edit ? handleRestore : undefined}
        emptyMessage={list.trash ? "Trash is empty." : "No FAQs yet."}
        searchPlaceholder="Search questions…"
        toolbar={
          permissions.create && (
            <button onClick={() => { setEditing(null); setDrawerOpen(true); }} className="ml-auto flex items-center gap-2 rounded-xl bg-gold px-4 py-2.5 text-sm font-semibold text-ivory transition-colors hover:bg-gold-deep">
              <Plus className="h-4 w-4" />
              New FAQ
            </button>
          )
        }
      />

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={editing ? "Edit FAQ" : "New FAQ"}>
        <FaqForm faq={editing} onSuccess={onFormSuccess} />
      </Drawer>

      <ConfirmDialog
        open={!!deleting}
        title="Move to trash?"
        description="This FAQ will be moved to trash."
        confirmLabel="Move to Trash"
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}
