"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Copy } from "lucide-react";
import { useAdminList } from "@/hooks/useAdminList";
import { AdminDataTable, type Column } from "@/components/admin/AdminDataTable";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Drawer } from "@/components/admin/Drawer";
import { OfferForm } from "./OfferForm";
import { listOffers, softDeleteOffer, restoreOffer, duplicateOffer, toggleOfferStatus, type OfferRow } from "./actions";

export function OffersManager({
  permissions,
}: {
  permissions: { create: boolean; edit: boolean; delete: boolean };
}) {
  const list = useAdminList<OfferRow>(listOffers);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<OfferRow | null>(null);
  const [deleting, setDeleting] = useState<OfferRow | null>(null);

  function openCreate() {
    setEditing(null);
    setDrawerOpen(true);
  }
  function openEdit(row: OfferRow) {
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
      await softDeleteOffer(deleting.id);
      toast.success(`"${deleting.name}" moved to trash`);
      list.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleting(null);
    }
  }

  async function handleRestore(row: OfferRow) {
    try {
      await restoreOffer(row.id);
      toast.success(`"${row.name}" restored`);
      list.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Restore failed");
    }
  }

  async function handleDuplicate(row: OfferRow) {
    try {
      await duplicateOffer(row.id);
      toast.success(`Duplicated "${row.name}" successfully`);
      list.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Duplicate failed");
    }
  }

  async function handleToggleStatus(row: OfferRow, newStatus: "ACTIVE" | "INACTIVE" | "SCHEDULED") {
    try {
      await toggleOfferStatus(row.id, newStatus);
      toast.success(`Updated "${row.name}" status to ${newStatus}`);
      list.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Status update failed");
    }
  }

  const columns: Column<OfferRow>[] = [
    {
      key: "name",
      label: "Offer Name",
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-medium text-white">{row.name}</p>
          <p className="text-xs text-white/35">
            Type: {row.type}
            {row.product && <span> · Product: {row.product.name}</span>}
            {row.collection && <span> · Collection: {row.collection.name}</span>}
            {row.category && <span> · Category: {row.category.name}</span>}
          </p>
        </div>
      ),
    },
    {
      key: "discount",
      label: "Discount / Deal",
      render: (row) => {
        if (row.discountPercentage) {
          return <span className="font-bold text-emerald-400">{row.discountPercentage}% OFF</span>;
        }
        if (row.offerPrice) {
          return (
            <span className="text-white/60">
              ₹{Number(row.offerPrice).toLocaleString()}
              {row.originalPrice && <span className="line-through text-white/20 ml-2">₹{Number(row.originalPrice).toLocaleString()}</span>}
            </span>
          );
        }
        return <span className="text-white/25">—</span>;
      },
    },
    {
      key: "validity",
      label: "Validity Period",
      render: (row) => {
        if (row.startDate || row.endDate) {
          const start = row.startDate ? new Date(row.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "Anytime";
          const end = row.endDate ? new Date(row.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Ongoing";
          return <span className="text-white/60">{start} – {end}</span>;
        }
        return <span className="text-white/25">Always Active</span>;
      },
    },
    {
      key: "status",
      label: "Status",
      render: (row) => {
        let classes = "bg-white/8 text-white/40";
        if (row.status === "ACTIVE") {
          classes = "bg-emerald-500/15 text-emerald-300";
        } else if (row.status === "SCHEDULED") {
          classes = "bg-blue-500/15 text-blue-300";
        }
        return (
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${classes}`}>
            {row.status}
          </span>
        );
      },
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
        rowActions={(row) => (
          <div className="flex items-center gap-1.5">
            {permissions.create && (
              <button
                onClick={() => handleDuplicate(row)}
                title="Duplicate Offer"
                className="rounded-lg p-1.5 text-white/40 hover:bg-white/8 hover:text-white transition-colors"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            )}
            {permissions.edit && (
              <select
                value={row.status}
                onChange={(e) => handleToggleStatus(row, e.target.value as "ACTIVE" | "INACTIVE" | "SCHEDULED")}
                className="rounded-lg bg-white/5 border border-white/10 px-2 py-1 text-xs text-white outline-none focus:border-gold"
              >
                <option value="ACTIVE" className="bg-[#1c1c1b] text-white">Active</option>
                <option value="INACTIVE" className="bg-[#1c1c1b] text-white">Inactive</option>
                <option value="SCHEDULED" className="bg-[#1c1c1b] text-white">Scheduled</option>
              </select>
            )}
          </div>
        )}
        emptyMessage={list.trash ? "Trash is empty." : "No offers yet."}
        searchPlaceholder="Search offers…"
        toolbar={
          permissions.create && (
            <button
              onClick={openCreate}
              className="ml-auto flex items-center gap-2 rounded-xl bg-gold px-4 py-2.5 text-sm font-semibold text-ivory transition-colors hover:bg-gold-deep"
            >
              <Plus className="h-4 w-4" />
              New Offer
            </button>
          )
        }
      />

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={editing ? "Edit Offer" : "New Offer"}>
        <OfferForm offer={editing} onSuccess={onFormSuccess} />
      </Drawer>

      <ConfirmDialog
        open={!!deleting}
        title="Move to trash?"
        description={`"${deleting?.name}" will be moved to trash.`}
        confirmLabel="Move to Trash"
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}
