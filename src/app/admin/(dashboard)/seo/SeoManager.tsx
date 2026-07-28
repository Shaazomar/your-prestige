"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, FileText, ArrowRightLeft } from "lucide-react";
import { useAdminList } from "@/hooks/useAdminList";
import { AdminDataTable, type Column } from "@/components/admin/AdminDataTable";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Drawer } from "@/components/admin/Drawer";
import { cn } from "@/lib/utils";
import { SeoPageForm } from "./SeoPageForm";
import { RedirectForm } from "./RedirectForm";
import { listSeoPages, deleteSeoPage, listRedirects, deleteRedirect } from "./actions";
import type { Seo, Redirect } from "@prisma/client";

export function SeoManager({ permissions }: { permissions: { create: boolean; edit: boolean; delete: boolean } }) {
  const [tab, setTab] = useState<"pages" | "redirects">("pages");

  return (
    <div>
      <div className="mb-5 flex overflow-hidden rounded-xl border border-white/10 w-fit">
        <button onClick={() => setTab("pages")} className={cn("flex items-center gap-1.5 px-4 py-2 text-xs font-medium", tab === "pages" ? "bg-gold/15 text-gold" : "text-white/50 hover:text-white")}>
          <FileText className="h-3.5 w-3.5" /> Pages
        </button>
        <button onClick={() => setTab("redirects")} className={cn("flex items-center gap-1.5 px-4 py-2 text-xs font-medium", tab === "redirects" ? "bg-gold/15 text-gold" : "text-white/50 hover:text-white")}>
          <ArrowRightLeft className="h-3.5 w-3.5" /> Redirects
        </button>
      </div>
      {tab === "pages" ? <SeoPagesTab permissions={permissions} /> : <RedirectsTab permissions={permissions} />}
    </div>
  );
}

function SeoPagesTab({ permissions }: { permissions: { create: boolean; edit: boolean; delete: boolean } }) {
  const list = useAdminList<Seo>(listSeoPages, { initialSortBy: "path", initialSortDir: "asc" });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Seo | null>(null);
  const [deleting, setDeleting] = useState<Seo | null>(null);

  async function handleDelete() {
    if (!deleting) return;
    try {
      await deleteSeoPage(deleting.id);
      toast.success("SEO entry deleted");
      list.refresh();
    } catch {
      toast.error("Delete failed");
    } finally {
      setDeleting(null);
    }
  }

  const columns: Column<Seo>[] = [
    { key: "path", label: "Path", sortable: true, render: (row) => <span className="font-mono text-sm text-white">{row.path}</span> },
    { key: "title", label: "Meta Title", render: (row) => <span className="max-w-xs truncate text-white/60">{row.title ?? "—"}</span> },
    { key: "noIndex", label: "Indexing", render: (row) => (row.noIndex ? <span className="rounded-full bg-red-400/15 px-2.5 py-1 text-xs text-red-300">No Index</span> : <span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-xs text-emerald-300">Indexed</span>) },
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
        onEdit={permissions.edit ? (row) => { setEditing(row); setDrawerOpen(true); } : undefined}
        onDelete={permissions.delete ? (row) => setDeleting(row) : undefined}
        emptyMessage="No page-level SEO overrides yet."
        searchPlaceholder="Search by path…"
        toolbar={
          permissions.create && (
            <button onClick={() => { setEditing(null); setDrawerOpen(true); }} className="ml-auto flex items-center gap-2 rounded-xl bg-gold px-4 py-2.5 text-sm font-semibold text-ivory hover:bg-gold-deep">
              <Plus className="h-4 w-4" /> New SEO Entry
            </button>
          )
        }
      />
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={editing ? `Edit SEO — ${editing.path}` : "New SEO Entry"}>
        <SeoPageForm page={editing} onSuccess={() => { setDrawerOpen(false); list.refresh(); }} />
      </Drawer>
      <ConfirmDialog open={!!deleting} title="Delete this SEO entry?" description={`Meta overrides for "${deleting?.path}" will be removed permanently.`} confirmLabel="Delete" onConfirm={handleDelete} onCancel={() => setDeleting(null)} />
    </>
  );
}

function RedirectsTab({ permissions }: { permissions: { create: boolean; edit: boolean; delete: boolean } }) {
  const list = useAdminList<Redirect>(listRedirects, { initialSortBy: "fromPath", initialSortDir: "asc" });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Redirect | null>(null);
  const [deleting, setDeleting] = useState<Redirect | null>(null);

  async function handleDelete() {
    if (!deleting) return;
    try {
      await deleteRedirect(deleting.id);
      toast.success("Redirect deleted");
      list.refresh();
    } catch {
      toast.error("Delete failed");
    } finally {
      setDeleting(null);
    }
  }

  const columns: Column<Redirect>[] = [
    { key: "fromPath", label: "From", sortable: true, render: (row) => <span className="font-mono text-sm text-white">{row.fromPath}</span> },
    { key: "toPath", label: "To", render: (row) => <span className="font-mono text-sm text-white/60">{row.toPath}</span> },
    { key: "statusCode", label: "Code", render: (row) => <span className="rounded-full bg-white/8 px-2.5 py-1 text-xs text-white/60">{row.statusCode}</span> },
    { key: "active", label: "Status", render: (row) => (row.active ? <span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-xs text-emerald-300">Active</span> : <span className="rounded-full bg-white/8 px-2.5 py-1 text-xs text-white/40">Disabled</span>) },
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
        onEdit={permissions.edit ? (row) => { setEditing(row); setDrawerOpen(true); } : undefined}
        onDelete={permissions.delete ? (row) => setDeleting(row) : undefined}
        emptyMessage="No redirects configured."
        searchPlaceholder="Search by path…"
        toolbar={
          permissions.create && (
            <button onClick={() => { setEditing(null); setDrawerOpen(true); }} className="ml-auto flex items-center gap-2 rounded-xl bg-gold px-4 py-2.5 text-sm font-semibold text-ivory hover:bg-gold-deep">
              <Plus className="h-4 w-4" /> New Redirect
            </button>
          )
        }
      />
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={editing ? "Edit Redirect" : "New Redirect"}>
        <RedirectForm redirect={editing} onSuccess={() => { setDrawerOpen(false); list.refresh(); }} />
      </Drawer>
      <ConfirmDialog open={!!deleting} title="Delete this redirect?" description={`"${deleting?.fromPath}" will stop redirecting immediately.`} confirmLabel="Delete" onConfirm={handleDelete} onCancel={() => setDeleting(null)} />
    </>
  );
}
