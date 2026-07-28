"use client";

import { useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Plus, Images as ImagesIcon } from "lucide-react";
import { useAdminList } from "@/hooks/useAdminList";
import { AdminDataTable, type Column } from "@/components/admin/AdminDataTable";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Drawer } from "@/components/admin/Drawer";
import { AlbumForm } from "./AlbumForm";
import { listAlbums, softDeleteAlbum, restoreAlbum, type AlbumRow } from "./actions";

export function GalleryManager({ permissions }: { permissions: { create: boolean; edit: boolean; delete: boolean } }) {
  const list = useAdminList<AlbumRow>(listAlbums, { initialSortBy: "sortOrder", initialSortDir: "asc" });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<AlbumRow | null>(null);
  const [deleting, setDeleting] = useState<AlbumRow | null>(null);

  function onFormSuccess() {
    list.refresh();
  }

  async function handleDelete() {
    if (!deleting) return;
    try {
      await softDeleteAlbum(deleting.id);
      toast.success(`"${deleting.title}" moved to trash`);
      list.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleting(null);
    }
  }

  async function handleRestore(row: AlbumRow) {
    try {
      await restoreAlbum(row.id);
      toast.success(`"${row.title}" restored`);
      list.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Restore failed");
    }
  }

  const columns: Column<AlbumRow>[] = [
    {
      key: "title",
      label: "Album",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          {row.coverImage ? (
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-white/5">
              <Image src={row.coverImage} alt="" fill sizes="40px" className="object-cover" />
            </div>
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/5 text-white/20">
              <ImagesIcon className="h-4 w-4" />
            </div>
          )}
          <div>
            <p className="font-medium text-white">{row.title}</p>
            <p className="text-xs text-white/35">/{row.slug}</p>
          </div>
        </div>
      ),
    },
    { key: "items", label: "Images", render: (row) => <span className="text-white/60">{row._count.items}</span> },
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
        emptyMessage={list.trash ? "Trash is empty." : "No albums yet — create one to start uploading."}
        searchPlaceholder="Search albums…"
        toolbar={
          permissions.create && (
            <button onClick={() => { setEditing(null); setDrawerOpen(true); }} className="ml-auto flex items-center gap-2 rounded-xl bg-gold px-4 py-2.5 text-sm font-semibold text-ivory transition-colors hover:bg-gold-deep">
              <Plus className="h-4 w-4" />
              New Album
            </button>
          )
        }
      />

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={editing ? "Edit Album" : "New Album"} wide>
        <AlbumForm album={editing} onSuccess={onFormSuccess} />
      </Drawer>

      <ConfirmDialog
        open={!!deleting}
        title="Move to trash?"
        description={`"${deleting?.title}" and its images will be moved to trash.`}
        confirmLabel="Move to Trash"
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}
