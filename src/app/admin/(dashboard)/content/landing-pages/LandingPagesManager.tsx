"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, ExternalLink } from "lucide-react";
import { AdminDataTable, type Column } from "@/components/admin/AdminDataTable";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Drawer } from "@/components/admin/Drawer";
import { useAdminList } from "@/hooks/useAdminList";
import { LandingPageForm } from "./LandingPageForm";
import {
  listLandingPages, softDeleteLandingPage, restoreLandingPage, type LandingPageRow,
} from "./actions";

export function LandingPagesManager({
  permissions,
}: {
  permissions: { create: boolean; edit: boolean; delete: boolean };
}) {
  const list = useAdminList<LandingPageRow>(listLandingPages, {
    initialSortBy: "sortOrder",
    initialSortDir: "asc",
  });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<LandingPageRow | null>(null);
  const [deleting, setDeleting] = useState<LandingPageRow | null>(null);

  async function handleDelete() {
    if (!deleting) return;
    try {
      await softDeleteLandingPage(deleting.id);
      toast.success("Landing page moved to trash");
      list.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleting(null);
    }
  }

  async function handleRestore(row: LandingPageRow) {
    try {
      await restoreLandingPage(row.id);
      toast.success("Landing page restored");
      list.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Restore failed");
    }
  }

  const columns: Column<LandingPageRow>[] = [
    {
      key: "title",
      label: "Page",
      sortable: true,
      render: (row) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{row.heading}</p>
          <p className="truncate text-xs text-white/35">/{row.slug}</p>
        </div>
      ),
    },
    {
      key: "serviceType",
      label: "Targets",
      sortable: true,
      render: (row) => (
        <span className="text-xs text-white/45">
          {[row.serviceType, row.locality ?? row.city].filter(Boolean).join(" · ") || "—"}
        </span>
      ),
    },
    {
      key: "published",
      label: "Status",
      sortable: true,
      render: (row) => (
        <span
          className={`rounded-full px-2.5 py-1 text-[0.65rem] font-semibold ${
            row.published ? "bg-emerald-500/20 text-emerald-300" : "bg-white/8 text-white/40"
          }`}
        >
          {row.published ? "Live" : "Draft"}
        </span>
      ),
    },
    {
      key: "view",
      label: "",
      render: (row) =>
        row.published ? (
          <a
            href={`/${row.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-gold hover:underline"
          >
            View <ExternalLink className="h-3 w-3" />
          </a>
        ) : null,
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
        onDelete={permissions.delete ? setDeleting : undefined}
        onRestore={permissions.edit ? handleRestore : undefined}
        searchPlaceholder="Search landing pages…"
        emptyMessage="No landing pages yet. Run scripts/seed-landing-pages.mjs for the eight local pages."
        toolbar={
          permissions.create ? (
            <button
              type="button"
              onClick={() => { setEditing(null); setDrawerOpen(true); }}
              className="inline-flex items-center gap-2 rounded-lg bg-gold px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-gold-deep"
            >
              <Plus className="h-4 w-4" /> New Landing Page
            </button>
          ) : undefined
        }
      />

      <Drawer
        open={drawerOpen}
        title={editing ? editing.heading : "New landing page"}
        description="Keyword pages served at root URLs, e.g. /tiles-mangaluru"
        onClose={() => setDrawerOpen(false)}
        wide
      >
        <LandingPageForm
          page={editing}
          onSuccess={() => { setDrawerOpen(false); list.refresh(); }}
        />
      </Drawer>

      <ConfirmDialog
        open={!!deleting}
        title="Move landing page to trash?"
        description={`"/${deleting?.slug}" will stop resolving and drop out of the sitemap. Existing inbound links will 404.`}
        confirmLabel="Move to Trash"
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}
