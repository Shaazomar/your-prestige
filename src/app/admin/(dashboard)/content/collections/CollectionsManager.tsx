"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { useAdminList } from "@/hooks/useAdminList";
import { AdminDataTable, type Column } from "@/components/admin/AdminDataTable";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Drawer } from "@/components/admin/Drawer";
import { CollectionForm } from "./CollectionForm";
import { listCollections, softDeleteCollection, restoreCollection, type CollectionRow } from "./actions";

interface CollectionsManagerProps {
  permissions: { create: boolean; edit: boolean; delete: boolean };
}

export function CollectionsManager({ permissions }: CollectionsManagerProps) {
  const list = useAdminList<CollectionRow>(listCollections, { initialSortBy: "sortOrder", initialSortDir: "asc" });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<CollectionRow | null>(null);
  const [deleting, setDeleting] = useState<CollectionRow | null>(null);

  function openCreate() {
    setEditing(null);
    setDrawerOpen(true);
  }
  function openEdit(row: CollectionRow) {
    setEditing(row);
    setDrawerOpen(true);
  }
  function onFormSuccess() {
    setDrawerOpen(false);
    list.refresh();
  }

  async function handleDelete() {
    if (!deleting) return;
    try {
      await softDeleteCollection(deleting.id);
      toast.success(`"${deleting.name}" moved to trash`);
      list.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleting(null);
    }
  }

  async function handleRestore(row: CollectionRow) {
    try {
      await restoreCollection(row.id);
      toast.success(`"${row.name}" restored`);
      list.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Restore failed");
    }
  }

  const columns: Column<CollectionRow>[] = [
    {
      key: "name",
      label: "Name",
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-medium text-white">{row.name}</p>
          <p className="text-xs text-white/35">/{row.slug}</p>
        </div>
      ),
    },
    {
      key: "products",
      label: "Products",
      render: (row) => <span className="text-white/60">{row._count.products}</span>,
    },
    {
      key: "sortOrder",
      label: "Order",
      sortable: true,
      render: (row) => <span className="text-white/60">{row.sortOrder}</span>,
    },
    {
      key: "published",
      label: "Status",
      render: (row) => (
        <span
          className={
            row.published
              ? "rounded-full bg-emerald-400/15 px-2.5 py-1 text-xs font-medium text-emerald-300"
              : "rounded-full bg-white/8 px-2.5 py-1 text-xs font-medium text-white/40"
          }
        >
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
        onEdit={permissions.edit ? openEdit : undefined}
        onDelete={permissions.delete ? (row) => setDeleting(row) : undefined}
        onRestore={permissions.edit ? handleRestore : undefined}
        emptyMessage={list.trash ? "Trash is empty." : "No collections yet — create your first one."}
        searchPlaceholder="Search collections…"
        toolbar={
          permissions.create && (
            <button
              onClick={openCreate}
              className="ml-auto flex items-center gap-2 rounded-xl bg-gold px-4 py-2.5 text-sm font-semibold text-ivory transition-colors hover:bg-gold-deep"
            >
              <Plus className="h-4 w-4" />
              New Collection
            </button>
          )
        }
      />

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editing ? "Edit Collection" : "New Collection"}
        description={editing ? `Editing "${editing.name}"` : "Add a new product collection"}
      >
        <CollectionForm collection={editing} onSuccess={onFormSuccess} />
      </Drawer>

      <ConfirmDialog
        open={!!deleting}
        title="Move to trash?"
        description={`"${deleting?.name}" will be moved to trash. You can restore it anytime.`}
        confirmLabel="Move to Trash"
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}
