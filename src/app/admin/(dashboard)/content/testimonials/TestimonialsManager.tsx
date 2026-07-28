"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Star } from "lucide-react";
import { useAdminList } from "@/hooks/useAdminList";
import { AdminDataTable, type Column } from "@/components/admin/AdminDataTable";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Drawer } from "@/components/admin/Drawer";
import { TestimonialForm } from "./TestimonialForm";
import { listTestimonials, softDeleteTestimonial, restoreTestimonial } from "./actions";
import type { Testimonial } from "@prisma/client";

export function TestimonialsManager({ permissions }: { permissions: { create: boolean; edit: boolean; delete: boolean } }) {
  const list = useAdminList<Testimonial>(listTestimonials);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [deleting, setDeleting] = useState<Testimonial | null>(null);

  function onFormSuccess() {
    setDrawerOpen(false);
    list.refresh();
  }

  async function handleDelete() {
    if (!deleting) return;
    try {
      await softDeleteTestimonial(deleting.id);
      toast.success(`"${deleting.name}" moved to trash`);
      list.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleting(null);
    }
  }

  async function handleRestore(row: Testimonial) {
    try {
      await restoreTestimonial(row.id);
      toast.success(`"${row.name}" restored`);
      list.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Restore failed");
    }
  }

  const columns: Column<Testimonial>[] = [
    {
      key: "name",
      label: "Testimonial",
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-medium text-white">{row.name}</p>
          <p className="max-w-xs truncate text-xs text-white/35">{row.quote}</p>
        </div>
      ),
    },
    {
      key: "rating",
      label: "Rating",
      render: (row) => (
        <div className="flex gap-0.5">
          {Array.from({ length: row.rating }).map((_, i) => <Star key={i} className="h-3 w-3 fill-gold text-gold" />)}
        </div>
      ),
    },
    { key: "source", label: "Source", render: (row) => <span className="rounded-full bg-white/8 px-2.5 py-1 text-xs capitalize text-white/60">{row.source}</span> },
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
        emptyMessage={list.trash ? "Trash is empty." : "No testimonials yet."}
        searchPlaceholder="Search testimonials…"
        toolbar={
          permissions.create && (
            <button onClick={() => { setEditing(null); setDrawerOpen(true); }} className="ml-auto flex items-center gap-2 rounded-xl bg-gold px-4 py-2.5 text-sm font-semibold text-ivory transition-colors hover:bg-gold-deep">
              <Plus className="h-4 w-4" />
              New Testimonial
            </button>
          )
        }
      />

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={editing ? "Edit Testimonial" : "New Testimonial"}>
        <TestimonialForm testimonial={editing} onSuccess={onFormSuccess} />
      </Drawer>

      <ConfirmDialog
        open={!!deleting}
        title="Move to trash?"
        description={`"${deleting?.name}"'s testimonial will be moved to trash.`}
        confirmLabel="Move to Trash"
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}
