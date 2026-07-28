"use client";

import { useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Plus, Star, Globe } from "lucide-react";
import { useAdminList } from "@/hooks/useAdminList";
import { AdminDataTable, type Column } from "@/components/admin/AdminDataTable";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Drawer } from "@/components/admin/Drawer";
import { BrandForm } from "./BrandForm";
import { listBrands, softDeleteBrand, restoreBrand, type BrandRow } from "./actions";

export function BrandsManager({ permissions }: { permissions: { create: boolean; edit: boolean; delete: boolean } }) {
  const list = useAdminList<BrandRow>(listBrands, { initialSortBy: "sortOrder", initialSortDir: "asc" });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<BrandRow | null>(null);
  const [deleting, setDeleting] = useState<BrandRow | null>(null);

  function onFormSuccess() {
    setDrawerOpen(false);
    list.refresh();
  }

  async function handleDelete() {
    if (!deleting) return;
    try {
      await softDeleteBrand(deleting.id);
      toast.success(`"${deleting.name}" moved to trash`);
      list.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleting(null);
    }
  }

  async function handleRestore(row: BrandRow) {
    try {
      await restoreBrand(row.id);
      toast.success(`"${row.name}" restored`);
      list.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Restore failed");
    }
  }

  const columns: Column<BrandRow>[] = [
    {
      key: "name",
      label: "Brand",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          {row.logo ? (
            <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-white/5">
              <Image src={row.logo} alt="" fill sizes="36px" className="object-contain" />
            </div>
          ) : (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5 text-xs text-white/30">
              {row.name.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-medium text-white">{row.name}</p>
            <p className="text-xs text-white/35">/{row.slug}</p>
          </div>
        </div>
      ),
    },
    { key: "products", label: "Products", render: (row) => <span className="text-white/60">{row._count.products}</span> },
    {
      key: "website",
      label: "Website",
      render: (row) =>
        row.website ? (
          <a href={row.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-gold hover:underline">
            <Globe className="h-3 w-3" /> Visit
          </a>
        ) : (
          <span className="text-white/25">—</span>
        ),
    },
    {
      key: "featured",
      label: "Featured",
      render: (row) => (row.featured ? <Star className="h-4 w-4 fill-gold text-gold" /> : <span className="text-white/25">—</span>),
    },
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
        emptyMessage={list.trash ? "Trash is empty." : "No brands yet — add your first partner house."}
        searchPlaceholder="Search brands…"
        toolbar={
          permissions.create && (
            <button
              onClick={() => { setEditing(null); setDrawerOpen(true); }}
              className="ml-auto flex items-center gap-2 rounded-xl bg-gold px-4 py-2.5 text-sm font-semibold text-ivory transition-colors hover:bg-gold-deep"
            >
              <Plus className="h-4 w-4" />
              New Brand
            </button>
          )
        }
      />

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={editing ? "Edit Brand" : "New Brand"}>
        <BrandForm brand={editing} onSuccess={onFormSuccess} />
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
