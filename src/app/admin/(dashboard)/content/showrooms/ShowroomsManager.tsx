"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { Plus, Star, ExternalLink, Store } from "lucide-react";
import { useAdminList } from "@/hooks/useAdminList";
import { AdminDataTable, type Column } from "@/components/admin/AdminDataTable";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Drawer } from "@/components/admin/Drawer";
import { ShowroomForm } from "./ShowroomForm";
import { listShowrooms, softDeleteShowroom, restoreShowroom, type ShowroomRow } from "./actions";

export function ShowroomsManager({
  permissions,
}: {
  permissions: { create: boolean; edit: boolean; delete: boolean };
}) {
  const list = useAdminList<ShowroomRow>(listShowrooms, {
    initialSortBy: "sortOrder",
    initialSortDir: "asc",
  });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<ShowroomRow | null>(null);
  const [deleting, setDeleting] = useState<ShowroomRow | null>(null);

  async function handleDelete() {
    if (!deleting) return;
    try {
      await softDeleteShowroom(deleting.id);
      toast.success(`"${deleting.name}" moved to trash`);
      list.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleting(null);
    }
  }

  async function handleRestore(row: ShowroomRow) {
    try {
      await restoreShowroom(row.id);
      toast.success(`"${row.name}" restored`);
      list.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Restore failed");
    }
  }

  const columns: Column<ShowroomRow>[] = [
    {
      key: "name",
      label: "Showroom",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          {row.heroImage ? (
            <div className="relative h-11 w-14 shrink-0 overflow-hidden rounded-lg bg-white/5">
              <Image src={row.heroImage} alt="" fill sizes="56px" className="object-cover" />
            </div>
          ) : (
            <div className="flex h-11 w-14 shrink-0 items-center justify-center rounded-lg bg-white/5 text-white/20">
              <Store className="h-4 w-4" />
            </div>
          )}
          <div>
            <p className="flex items-center gap-1.5 font-medium text-white">
              {row.name}
              {row.isFlagship && <Star className="h-3 w-3 fill-gold text-gold" />}
            </p>
            <p className="text-xs text-white/35">{row.subtitle ?? `/${row.slug}`}</p>
          </div>
        </div>
      ),
    },
    {
      key: "city",
      label: "Location",
      sortable: true,
      render: (row) => (
        <div>
          <p className="text-white/70">{row.locality ?? row.city}</p>
          <p className="text-xs text-white/35">{row.city}</p>
        </div>
      ),
    },
    { key: "phone", label: "Phone", render: (row) => <span className="text-white/60">{row.phone}</span> },
    {
      key: "gallery",
      label: "Images",
      render: (row) => (
        <span className="text-white/60">{Array.isArray(row.gallery) ? row.gallery.length : 0}</span>
      ),
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
        onEdit={permissions.edit ? (row) => { setEditing(row); setDrawerOpen(true); } : undefined}
        onDelete={permissions.delete ? (row) => setDeleting(row) : undefined}
        onRestore={permissions.edit ? handleRestore : undefined}
        emptyMessage={list.trash ? "Trash is empty." : "No showrooms yet."}
        searchPlaceholder="Search name, city, locality…"
        rowActions={(row) =>
          !list.trash ? (
            <Link
              href={`/showrooms/${row.slug}`}
              target="_blank"
              aria-label="View public page"
              className="rounded-lg p-1.5 text-white/40 transition-colors hover:bg-white/8 hover:text-white"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          ) : null
        }
        toolbar={
          permissions.create && (
            <button
              onClick={() => { setEditing(null); setDrawerOpen(true); }}
              className="ml-auto flex items-center gap-2 rounded-xl bg-gold px-4 py-2.5 text-sm font-semibold text-ivory transition-colors hover:bg-gold-deep"
            >
              <Plus className="h-4 w-4" />
              New Showroom
            </button>
          )
        }
      />

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editing ? "Edit Showroom" : "New Showroom"}
        description={editing ? editing.name : "Add a branch location"}
        wide
      >
        <ShowroomForm
          showroom={editing}
          onSuccess={() => { setDrawerOpen(false); list.refresh(); }}
        />
      </Drawer>

      <ConfirmDialog
        open={!!deleting}
        title="Move to trash?"
        description={`"${deleting?.name}" will be hidden from the website. You can restore it anytime.`}
        confirmLabel="Move to Trash"
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}
