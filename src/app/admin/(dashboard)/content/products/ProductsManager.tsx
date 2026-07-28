"use client";

import { useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Plus, Star, Trash2 } from "lucide-react";
import { useAdminList } from "@/hooks/useAdminList";
import { AdminDataTable, type Column } from "@/components/admin/AdminDataTable";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Drawer } from "@/components/admin/Drawer";
import { ProductForm } from "./ProductForm";
import { listProducts, softDeleteProduct, restoreProduct, bulkDeleteProducts, type ProductRow } from "./actions";

export function ProductsManager({ permissions }: { permissions: { create: boolean; edit: boolean; delete: boolean } }) {
  const list = useAdminList<ProductRow>(listProducts);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<ProductRow | null>(null);
  const [deleting, setDeleting] = useState<ProductRow | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkConfirm, setBulkConfirm] = useState(false);

  function onFormSuccess() {
    setDrawerOpen(false);
    list.refresh();
  }

  async function handleDelete() {
    if (!deleting) return;
    try {
      await softDeleteProduct(deleting.id);
      toast.success(`"${deleting.name}" moved to trash`);
      list.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleting(null);
    }
  }

  async function handleRestore(row: ProductRow) {
    try {
      await restoreProduct(row.id);
      toast.success(`"${row.name}" restored`);
      list.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Restore failed");
    }
  }

  async function handleBulkDelete() {
    try {
      await bulkDeleteProducts(Array.from(selected));
      toast.success(`${selected.size} products moved to trash`);
      setSelected(new Set());
      list.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bulk delete failed");
    } finally {
      setBulkConfirm(false);
    }
  }

  const columns: Column<ProductRow>[] = [
    {
      key: "select",
      label: "",
      className: "w-10",
      render: (row) => (
        <input
          type="checkbox"
          checked={selected.has(row.id)}
          onChange={(e) => {
            const next = new Set(selected);
            if (e.target.checked) next.add(row.id); else next.delete(row.id);
            setSelected(next);
          }}
          className="accent-gold"
        />
      ),
    },
    {
      key: "name",
      label: "Product",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          {row.lifestyleImage ? (
            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-white/5">
              <Image src={row.lifestyleImage} alt="" fill sizes="44px" className="object-cover" />
            </div>
          ) : (
            <div className="h-11 w-11 shrink-0 rounded-lg bg-white/5" />
          )}
          <div>
            <p className="font-medium text-white">{row.name}</p>
            <p className="text-xs text-white/35">{row.collection || `/${row.slug}`}</p>
          </div>
        </div>
      ),
    },
    { key: "category", label: "Category", render: (row) => <span className="text-white/60">{row.category?.name ?? "—"}</span> },
    { key: "brand", label: "Brand", render: (row) => <span className="text-white/60">{row.brand?.name ?? "—"}</span> },
    { key: "tag", label: "Tag", render: (row) => row.tag ? <span className="rounded-full bg-gold/15 px-2.5 py-1 text-xs font-medium text-gold">{row.tag}</span> : <span className="text-white/25">—</span> },
    { key: "featured", label: "Featured", render: (row) => row.featured ? <Star className="h-4 w-4 fill-gold text-gold" /> : <span className="text-white/25">—</span> },
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
        emptyMessage={list.trash ? "Trash is empty." : "No products yet — build the catalogue."}
        searchPlaceholder="Search products, collections…"
        toolbar={
          <div className="ml-auto flex items-center gap-2">
            {selected.size > 0 && permissions.delete && (
              <button onClick={() => setBulkConfirm(true)} className="flex items-center gap-2 rounded-xl border border-red-500/20 px-4 py-2.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10">
                <Trash2 className="h-4 w-4" />
                Delete {selected.size}
              </button>
            )}
            {permissions.create && (
              <button onClick={() => { setEditing(null); setDrawerOpen(true); }} className="flex items-center gap-2 rounded-xl bg-gold px-4 py-2.5 text-sm font-semibold text-ivory transition-colors hover:bg-gold-deep">
                <Plus className="h-4 w-4" />
                New Product
              </button>
            )}
          </div>
        }
      />

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={editing ? "Edit Product" : "New Product"} wide>
        <ProductForm product={editing} onSuccess={onFormSuccess} />
      </Drawer>

      <ConfirmDialog
        open={!!deleting}
        title="Move to trash?"
        description={`"${deleting?.name}" will be moved to trash. You can restore it anytime.`}
        confirmLabel="Move to Trash"
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />

      <ConfirmDialog
        open={bulkConfirm}
        title={`Move ${selected.size} products to trash?`}
        description="You can restore them individually afterward."
        confirmLabel="Delete Selected"
        onConfirm={handleBulkDelete}
        onCancel={() => setBulkConfirm(false)}
      />
    </>
  );
}
