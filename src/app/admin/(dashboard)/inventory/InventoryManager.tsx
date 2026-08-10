"use client";

import { useState } from "react";
import { useAdminList } from "@/hooks/useAdminList";
import { AdminDataTable, type Column } from "@/components/admin/AdminDataTable";
import { Drawer } from "@/components/admin/Drawer";
import { InventoryForm } from "./InventoryForm";
import { listInventory, type InventoryRow } from "./actions";

interface InventoryManagerProps {
  canEdit: boolean;
}

export function InventoryManager({ canEdit }: InventoryManagerProps) {
  const list = useAdminList<InventoryRow>(listInventory, { initialSortBy: "name", initialSortDir: "asc" });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<InventoryRow | null>(null);

  function openEdit(row: InventoryRow) {
    setEditing(row);
    setDrawerOpen(true);
  }

  function onFormSuccess() {
    setDrawerOpen(false);
    list.refresh();
  }

  const columns: Column<InventoryRow>[] = [
    {
      key: "name",
      label: "Product Name",
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-medium text-white">{row.name}</p>
          <p className="text-xs text-white/35">
            SKU: {row.sku || row.productCode || "N/A"}
          </p>
        </div>
      ),
    },
    {
      key: "category",
      label: "Category",
      render: (row) => (
        <span className="text-white/60 capitalize">
          {row.category?.name || "Uncategorised"}
        </span>
      ),
    },
    {
      key: "status",
      label: "Stock Status",
      render: (row) => {
        const status = row.inventory?.stockStatus || "OUT_OF_STOCK";
        let classes = "bg-white/8 text-white/40 border-white/10";
        let label = "OUT OF STOCK";
        if (status === "IN_STOCK") {
          classes = "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
          label = "IN STOCK";
        } else if (status === "LIMITED_STOCK") {
          classes = "bg-amber-500/15 text-amber-300 border-amber-500/30";
          label = "LIMITED STOCK";
        } else if (status === "COMING_SOON") {
          classes = "bg-blue-500/15 text-blue-300 border-blue-500/30";
          label = "COMING SOON";
        }
        return (
          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${classes}`}>
            {label}
          </span>
        );
      },
    },
    {
      key: "available",
      label: "Available Qty",
      render: (row) => (
        <span className="font-bold text-white">
          {row.inventory?.availableStock ?? 0}
        </span>
      ),
    },
    {
      key: "reserved",
      label: "Reserved Qty",
      render: (row) => (
        <span className="text-white/60">
          {row.inventory?.reservedStock ?? 0}
        </span>
      ),
    },
    {
      key: "damaged",
      label: "Damaged / Transit",
      render: (row) => (
        <span className="text-white/40">
          {row.inventory?.damagedStock ?? 0} / {row.inventory?.transitStock ?? 0}
        </span>
      ),
    },
    {
      key: "minStock",
      label: "Min Warning",
      render: (row) => {
        const isLow = (row.inventory?.availableStock ?? 0) <= (row.inventory?.minimumStock ?? 0);
        return (
          <span className={`font-medium ${isLow ? "text-red-400 font-bold" : "text-white/40"}`}>
            {row.inventory?.minimumStock ?? 0}
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
        trash={false}
        onTrashToggle={() => {}}
        onEdit={canEdit ? openEdit : undefined}
        emptyMessage="No catalog products found to track stock."
        searchPlaceholder="Search products for stock levels…"
      />

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Adjust Inventory levels"
        description={editing ? `Adjusting stock for "${editing.name}"` : ""}
      >
        {editing && <InventoryForm row={editing} onSuccess={onFormSuccess} />}
      </Drawer>
    </>
  );
}
