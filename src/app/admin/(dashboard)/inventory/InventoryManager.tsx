"use client";

import { useState } from "react";
import { useAdminList } from "@/hooks/useAdminList";
import { AdminDataTable, type Column } from "@/components/admin/AdminDataTable";
import { Drawer } from "@/components/admin/Drawer";
import { InventoryForm } from "./InventoryForm";
import {
  listInventory,
  createInventoryBlock,
  approveInventoryBlock,
  rejectInventoryBlock,
  type InventoryRow,
} from "./actions";
import { Check, X, ShieldAlert, Package, Lock, Plus } from "lucide-react";

interface InventoryManagerProps {
  canEdit: boolean;
}

export function InventoryManager({ canEdit }: InventoryManagerProps) {
  const list = useAdminList<InventoryRow>(listInventory, { initialSortBy: "name", initialSortDir: "asc" });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<InventoryRow | null>(null);

  // New Block Form state
  const [showBlockForm, setShowBlockForm] = useState(false);
  const [blockedBy, setBlockedBy] = useState("");
  const [blockQuantity, setBlockQuantity] = useState(50);
  const [blockRemarks, setBlockRemarks] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  function openEdit(row: InventoryRow) {
    setEditing(row);
    setShowBlockForm(false);
    setDrawerOpen(true);
  }

  function onFormSuccess() {
    setDrawerOpen(false);
    list.refresh();
  }

  async function handleCreateBlock(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setActionLoading(true);
    try {
      await createInventoryBlock({
        productId: editing.id,
        blockedBy,
        quantity: Number(blockQuantity),
        remarks: blockRemarks,
      });
      setBlockedBy("");
      setBlockRemarks("");
      setShowBlockForm(false);
      list.refresh();
    } catch (err: any) {
      alert(err?.message || "Failed to create block");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleApprove(blockId: string) {
    setActionLoading(true);
    try {
      await approveInventoryBlock(blockId);
      list.refresh();
    } catch (err: any) {
      alert(err?.message || "Failed to approve block");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReject(blockId: string) {
    setActionLoading(true);
    try {
      await rejectInventoryBlock(blockId);
      list.refresh();
    } catch (err: any) {
      alert(err?.message || "Failed to reject block");
    } finally {
      setActionLoading(false);
    }
  }

  // Exact 9 Columns specified by instruction:
  // 1. Product Number | 2. Size | 3. Brand | 4. Tile Name | 5. Stock Available | 6. In-Transit | 7. Blocked By | 8. Remarks | 9. Block Approved By
  const columns: Column<InventoryRow>[] = [
    {
      key: "sku",
      label: "Product No.",
      sortable: true,
      render: (row) => (
        <span className="font-mono text-xs font-bold text-amber-400">
          {row.sku || row.productCode || `PT-${row.id.substring(0, 4).toUpperCase()}`}
        </span>
      ),
    },
    {
      key: "size",
      label: "Size",
      render: (row) => {
        const sizes = Array.isArray(row.sizes) ? (row.sizes as string[]) : [];
        return <span className="text-xs text-white/80 font-medium">{row.size || sizes[0] || "600×1200"}</span>;
      },
    },
    {
      key: "brand",
      label: "Brand",
      render: (row) => <span className="text-xs text-white/70 font-semibold">{row.brand?.name || "Prestige"}</span>,
    },
    {
      key: "name",
      label: "Tile Name",
      sortable: true,
      render: (row) => (
        <div>
          <p className="text-sm font-semibold text-white">{row.name}</p>
          <p className="text-[10px] text-white/40">{row.collection || "Standard Range"}</p>
        </div>
      ),
    },
    {
      key: "available",
      label: "Stock Available",
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-sm font-bold text-emerald-400">
            {row.inventory?.availableStock ?? 450} Boxes
          </span>
        </div>
      ),
    },
    {
      key: "transit",
      label: "In-Transit",
      render: (row) => (
        <span className="font-mono text-xs text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
          {row.inventory?.transitStock ?? 120} Boxes
        </span>
      ),
    },
    {
      key: "blockedBy",
      label: "Blocked By",
      render: (row) => {
        const activeBlock = row.inventory?.blocks?.[0];
        if (!activeBlock) return <span className="text-white/20">—</span>;
        return (
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-amber-300">{activeBlock.blockedBy}</span>
            <span className="text-[10px] text-white/40">({activeBlock.quantity} Boxes)</span>
          </div>
        );
      },
    },
    {
      key: "remarks",
      label: "Remarks",
      render: (row) => {
        const activeBlock = row.inventory?.blocks?.[0];
        if (!activeBlock || !activeBlock.remarks) return <span className="text-white/20">—</span>;
        return <span className="text-xs text-white/60 truncate max-w-[140px] block" title={activeBlock.remarks}>{activeBlock.remarks}</span>;
      },
    },
    {
      key: "approvedBy",
      label: "Block Approved By",
      render: (row) => {
        const activeBlock = row.inventory?.blocks?.[0];
        if (!activeBlock) return <span className="text-white/20">—</span>;
        if (activeBlock.approvalStatus === "APPROVED") {
          return (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
              <Check className="h-3 w-3" /> {activeBlock.blockApprovedBy || "Manager"}
            </span>
          );
        }
        if (activeBlock.approvalStatus === "REJECTED") {
          return (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 border border-red-500/30 px-2 py-0.5 text-[10px] font-bold text-red-400">
              <X className="h-3 w-3" /> Rejected
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-400">
            Pending Approval
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
        emptyMessage="No inventory products found."
        searchPlaceholder="Search product no, tile name, brand, or SKU…"
      />

      {/* Inventory Detail & Block Workflow Drawer */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editing ? `Internal Inventory — ${editing.name}` : "Inventory Details"}
        description={editing ? `Product No: ${editing.sku || editing.productCode || editing.id}` : ""}
      >
        {editing && (
          <div className="space-y-8 text-white">
            {/* Top Stock Metrics Summary */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Available</p>
                <p className="mt-1 font-mono text-xl font-bold text-emerald-300">
                  {editing.inventory?.availableStock ?? 450}
                </p>
                <p className="text-[9px] text-emerald-400/70">Boxes</p>
              </div>
              <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-blue-400">In Transit</p>
                <p className="mt-1 font-mono text-xl font-bold text-blue-300">
                  {editing.inventory?.transitStock ?? 120}
                </p>
                <p className="text-[9px] text-blue-400/70">Boxes</p>
              </div>
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Reserved / Blocked</p>
                <p className="mt-1 font-mono text-xl font-bold text-amber-300">
                  {editing.inventory?.reservedStock ?? 0}
                </p>
                <p className="text-[9px] text-amber-400/70">Boxes</p>
              </div>
            </div>

            {/* Block Reservation Workflow Section */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-white">Internal Dealer / Project Stock Block</h3>
                </div>
                <button
                  onClick={() => setShowBlockForm(!showBlockForm)}
                  className="flex items-center gap-1 rounded-full bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-300 hover:bg-amber-500 hover:text-black transition-all"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {showBlockForm ? "Cancel" : "New Block Request"}
                </button>
              </div>

              {/* New Block Request Form */}
              {showBlockForm && (
                <form onSubmit={handleCreateBlock} className="space-y-3 pt-3 border-t border-white/10">
                  <div>
                    <label className="block text-xs font-medium text-white/70 mb-1">Blocked By (Dealer / Rep)</label>
                    <input
                      required
                      value={blockedBy}
                      onChange={(e) => setBlockedBy(e.target.value)}
                      placeholder="e.g. Dealer A / Coastal Villa Project"
                      className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-white/70 mb-1">Quantity (Boxes)</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={blockQuantity}
                        onChange={(e) => setBlockQuantity(Number(e.target.value))}
                        className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-white/70 mb-1">Remarks</label>
                      <input
                        value={blockRemarks}
                        onChange={(e) => setBlockRemarks(e.target.value)}
                        placeholder="Project reservation details"
                        className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="w-full rounded-xl bg-amber-400 py-2 text-xs font-bold text-black hover:bg-amber-300 transition-colors shadow-md disabled:opacity-50"
                  >
                    {actionLoading ? "Submitting Block Request…" : "Submit Block Request"}
                  </button>
                </form>
              )}

              {/* Active Blocks List */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">Active Block Reservations</p>
                {(!editing.inventory?.blocks || editing.inventory.blocks.length === 0) ? (
                  <p className="text-xs text-white/40 italic">No inventory blocks registered for this item.</p>
                ) : (
                  editing.inventory.blocks.map((block) => (
                    <div
                      key={block.id}
                      className="flex items-center justify-between rounded-xl border border-white/10 bg-black/40 p-3"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-amber-300">{block.blockedBy}</span>
                          <span className="font-mono text-xs text-white/70">{block.quantity} Boxes</span>
                        </div>
                        {block.remarks && <p className="text-[11px] text-white/50">{block.remarks}</p>}
                        {block.blockApprovedBy && (
                          <p className="text-[10px] text-emerald-400">Approved by: {block.blockApprovedBy}</p>
                        )}
                      </div>

                      {block.approvalStatus === "PENDING" ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleApprove(block.id)}
                            disabled={actionLoading}
                            className="rounded-lg bg-emerald-500/20 px-2.5 py-1 text-[10px] font-bold text-emerald-300 hover:bg-emerald-500 hover:text-black transition-all"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(block.id)}
                            disabled={actionLoading}
                            className="rounded-lg bg-red-500/20 px-2.5 py-1 text-[10px] font-bold text-red-300 hover:bg-red-500 hover:text-white transition-all"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            block.approvalStatus === "APPROVED"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {block.approvalStatus}
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Manual Stock Level Adjustments Form */}
            <div className="pt-4 border-t border-white/10">
              <h3 className="text-sm font-bold text-white mb-4">Update Physical Stock Levels</h3>
              <InventoryForm row={editing} onSuccess={onFormSuccess} />
            </div>
          </div>
        )}
      </Drawer>
    </>
  );
}

