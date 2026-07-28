"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Check, X, BellRing, List, CalendarDays } from "lucide-react";
import { useAdminList } from "@/hooks/useAdminList";
import { AdminDataTable, type Column } from "@/components/admin/AdminDataTable";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Drawer } from "@/components/admin/Drawer";
import { cn } from "@/lib/utils";
import { BookingForm } from "./BookingForm";
import { BookingsCalendar } from "./BookingsCalendar";
import {
  listBookings, softDeleteBooking, restoreBooking, confirmBooking, rejectBooking, sendReminder,
  type BookingRow,
} from "./actions";

const statusStyles: Record<string, string> = {
  PENDING: "bg-gold/15 text-gold",
  CONFIRMED: "bg-emerald-400/15 text-emerald-300",
  RESCHEDULED: "bg-amber-400/15 text-amber-300",
  COMPLETED: "bg-sky-400/15 text-sky-300",
  CANCELLED: "bg-white/8 text-white/40",
  REJECTED: "bg-red-400/15 text-red-300",
  NO_SHOW: "bg-red-400/15 text-red-300",
};

export function BookingsManager({ permissions }: { permissions: { create: boolean; edit: boolean; delete: boolean } }) {
  const list = useAdminList<BookingRow>(listBookings, { initialSortBy: "requestedDate", initialSortDir: "asc" });
  const [view, setView] = useState<"list" | "calendar">("list");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<BookingRow | null>(null);
  const [deleting, setDeleting] = useState<BookingRow | null>(null);

  function onFormSuccess() {
    setDrawerOpen(false);
    list.refresh();
  }

  async function handleDelete() {
    if (!deleting) return;
    try {
      await softDeleteBooking(deleting.id);
      toast.success(`Booking for "${deleting.name}" moved to trash`);
      list.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleting(null);
    }
  }

  async function handleRestore(row: BookingRow) {
    try {
      await restoreBooking(row.id);
      toast.success("Booking restored");
      list.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Restore failed");
    }
  }

  async function handleConfirm(row: BookingRow) {
    try {
      await confirmBooking(row.id);
      toast.success(`Confirmed ${row.name}'s visit`);
      list.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  }

  async function handleReject(row: BookingRow) {
    try {
      await rejectBooking(row.id);
      toast.success(`Rejected ${row.name}'s request`);
      list.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  }

  async function handleRemind(row: BookingRow) {
    try {
      await sendReminder(row.id);
      toast.success(row.email ? `Reminder sent to ${row.email}` : "Reminder logged (no email on file)");
      list.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  }

  const columns: Column<BookingRow>[] = [
    {
      key: "name",
      label: "Visitor",
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-medium text-white">{row.name}</p>
          <p className="text-xs text-white/35">{row.phone}</p>
        </div>
      ),
    },
    {
      key: "requestedDate",
      label: "Date",
      sortable: true,
      render: (row) => (
        <span className="text-white/60">
          {new Date(row.requestedDate).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
        </span>
      ),
    },
    { key: "consultant", label: "Consultant", render: (row) => <span className="text-white/60">{row.assignedConsultant?.name ?? "Unassigned"}</span> },
    {
      key: "status",
      label: "Status",
      render: (row) => <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", statusStyles[row.status])}>{row.status.replace("_", " ")}</span>,
    },
  ];

  return (
    <>
      <div className="mb-4 flex overflow-hidden rounded-xl border border-white/10 w-fit">
        <button onClick={() => setView("list")} className={cn("flex items-center gap-1.5 px-4 py-2 text-xs font-medium", view === "list" ? "bg-gold/15 text-gold" : "text-white/50 hover:text-white")}>
          <List className="h-3.5 w-3.5" /> List
        </button>
        <button onClick={() => setView("calendar")} className={cn("flex items-center gap-1.5 px-4 py-2 text-xs font-medium", view === "calendar" ? "bg-gold/15 text-gold" : "text-white/50 hover:text-white")}>
          <CalendarDays className="h-3.5 w-3.5" /> Calendar
        </button>
      </div>

      {view === "calendar" ? (
        <BookingsCalendar onSelect={(b) => { setEditing(b); setDrawerOpen(true); }} />
      ) : (
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
          emptyMessage={list.trash ? "Trash is empty." : "No bookings yet."}
          searchPlaceholder="Search by name or phone…"
          rowActions={(row) =>
            permissions.edit && !list.trash ? (
              <>
                {row.status === "PENDING" && (
                  <>
                    <button onClick={() => handleConfirm(row)} aria-label="Confirm" className="rounded-lg p-1.5 text-emerald-400 hover:bg-emerald-400/10">
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => handleReject(row)} aria-label="Reject" className="rounded-lg p-1.5 text-red-400 hover:bg-red-400/10">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
                <button onClick={() => handleRemind(row)} aria-label="Send reminder" className="rounded-lg p-1.5 text-white/40 hover:bg-white/8 hover:text-white">
                  <BellRing className="h-3.5 w-3.5" />
                </button>
              </>
            ) : null
          }
          toolbar={
            permissions.create && (
              <button onClick={() => { setEditing(null); setDrawerOpen(true); }} className="ml-auto flex items-center gap-2 rounded-xl bg-gold px-4 py-2.5 text-sm font-semibold text-ivory transition-colors hover:bg-gold-deep">
                <Plus className="h-4 w-4" />
                New Booking
              </button>
            )
          }
        />
      )}

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={editing ? "Edit Booking" : "New Booking"}>
        <BookingForm booking={editing} onSuccess={onFormSuccess} />
      </Drawer>

      <ConfirmDialog
        open={!!deleting}
        title="Move to trash?"
        description={`The booking for "${deleting?.name}" will be moved to trash.`}
        confirmLabel="Move to Trash"
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}
