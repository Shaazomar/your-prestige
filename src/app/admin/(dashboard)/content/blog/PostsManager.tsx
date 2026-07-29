"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Wand2 } from "lucide-react";
import { useAdminList } from "@/hooks/useAdminList";
import { AdminDataTable, type Column } from "@/components/admin/AdminDataTable";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Drawer } from "@/components/admin/Drawer";
import { ComposeDrawer } from "./ComposeDrawer";
import { PostForm } from "./PostForm";
import { listPosts, softDeletePost, restorePost, type PostRow } from "./actions";

const statusStyles: Record<PostRow["status"], string> = {
  draft: "bg-white/8 text-white/40",
  scheduled: "bg-amber-400/15 text-amber-300",
  published: "bg-emerald-400/15 text-emerald-300",
};

export function PostsManager({ permissions }: { permissions: { create: boolean; edit: boolean; delete: boolean } }) {
  const list = useAdminList<PostRow>(listPosts);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [editing, setEditing] = useState<PostRow | null>(null);
  const [deleting, setDeleting] = useState<PostRow | null>(null);

  function onFormSuccess() {
    setDrawerOpen(false);
    list.refresh();
  }

  async function handleDelete() {
    if (!deleting) return;
    try {
      await softDeletePost(deleting.id);
      toast.success(`"${deleting.title}" moved to trash`);
      list.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleting(null);
    }
  }

  async function handleRestore(row: PostRow) {
    try {
      await restorePost(row.id);
      toast.success(`"${row.title}" restored`);
      list.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Restore failed");
    }
  }

  const columns: Column<PostRow>[] = [
    {
      key: "title",
      label: "Post",
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-medium text-white">{row.title}</p>
          <p className="text-xs text-white/35">/{row.slug}</p>
        </div>
      ),
    },
    { key: "category", label: "Category", render: (row) => <span className="text-white/60">{row.category ?? "—"}</span> },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusStyles[row.status]}`}>
          {row.status}
          {row.status === "scheduled" && row.scheduledAt && ` · ${new Date(row.scheduledAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`}
        </span>
      ),
    },
    {
      key: "createdAt",
      label: "Created",
      sortable: true,
      render: (row) => <span className="text-white/50">{new Date(row.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>,
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
        emptyMessage={list.trash ? "Trash is empty." : "No posts yet — write your first article."}
        searchPlaceholder="Search posts…"
        toolbar={
          permissions.create && (
            <div className="ml-auto flex items-center gap-2">
              <button onClick={() => setComposeOpen(true)} className="flex items-center gap-2 rounded-xl border border-white/12 px-4 py-2.5 text-sm font-medium transition-colors hover:border-gold/40">
                <Wand2 className="h-4 w-4" />
                Compose Draft
              </button>
              <button onClick={() => { setEditing(null); setDrawerOpen(true); }} className="flex items-center gap-2 rounded-xl bg-gold px-4 py-2.5 text-sm font-semibold text-ivory transition-colors hover:bg-gold-deep">
                <Plus className="h-4 w-4" />
                New Post
              </button>
            </div>
          )
        }
      />

      <ComposeDrawer
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        onComposed={() => { setComposeOpen(false); list.refresh(); }}
      />

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={editing ? "Edit Post" : "New Post"} wide>
        <PostForm post={editing} onSuccess={onFormSuccess} />
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
