"use client";

import { useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Plus, PlayCircle, Star } from "lucide-react";
import { useAdminList } from "@/hooks/useAdminList";
import { AdminDataTable, type Column } from "@/components/admin/AdminDataTable";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Drawer } from "@/components/admin/Drawer";
import { VideoForm } from "./VideoForm";
import { listVideos, softDeleteVideo, restoreVideo } from "./actions";
import type { Video } from "@prisma/client";

export function VideosManager({ permissions }: { permissions: { create: boolean; edit: boolean; delete: boolean } }) {
  const list = useAdminList<Video>(listVideos, { initialSortBy: "sortOrder", initialSortDir: "asc" });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Video | null>(null);
  const [deleting, setDeleting] = useState<Video | null>(null);

  function onFormSuccess() {
    setDrawerOpen(false);
    list.refresh();
  }

  async function handleDelete() {
    if (!deleting) return;
    try {
      await softDeleteVideo(deleting.id);
      toast.success(`"${deleting.title}" moved to trash`);
      list.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleting(null);
    }
  }

  async function handleRestore(row: Video) {
    try {
      await restoreVideo(row.id);
      toast.success(`"${row.title}" restored`);
      list.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Restore failed");
    }
  }

  const columns: Column<Video>[] = [
    {
      key: "title",
      label: "Video",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          {row.thumbnail ? (
            <div className="relative h-10 w-16 shrink-0 overflow-hidden rounded-lg bg-white/5">
              <Image src={row.thumbnail} alt="" fill sizes="64px" className="object-cover" />
            </div>
          ) : (
            <div className="flex h-10 w-16 shrink-0 items-center justify-center rounded-lg bg-white/5 text-white/20">
              <PlayCircle className="h-4 w-4" />
            </div>
          )}
          <p className="font-medium text-white">{row.title}</p>
        </div>
      ),
    },
    { key: "provider", label: "Provider", render: (row) => <span className="rounded-full bg-white/8 px-2.5 py-1 text-xs text-white/60">{row.provider}</span> },
    { key: "category", label: "Category", render: (row) => <span className="text-white/60">{row.category ?? "—"}</span> },
    { key: "featured", label: "Featured", render: (row) => (row.featured ? <Star className="h-4 w-4 fill-gold text-gold" /> : <span className="text-white/25">—</span>) },
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
        emptyMessage={list.trash ? "Trash is empty." : "No videos yet."}
        searchPlaceholder="Search videos…"
        toolbar={
          permissions.create && (
            <button onClick={() => { setEditing(null); setDrawerOpen(true); }} className="ml-auto flex items-center gap-2 rounded-xl bg-gold px-4 py-2.5 text-sm font-semibold text-ivory transition-colors hover:bg-gold-deep">
              <Plus className="h-4 w-4" />
              New Video
            </button>
          )
        }
      />

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={editing ? "Edit Video" : "New Video"}>
        <VideoForm video={editing} onSuccess={onFormSuccess} />
      </Drawer>

      <ConfirmDialog
        open={!!deleting}
        title="Move to trash?"
        description={`"${deleting?.title}" will be moved to trash.`}
        confirmLabel="Move to Trash"
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}
