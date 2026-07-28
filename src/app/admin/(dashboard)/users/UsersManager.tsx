"use client";

import { useState } from "react";
import { toast } from "sonner";
import { UserPlus, Mail, KeyRound, Power } from "lucide-react";
import { useAdminList } from "@/hooks/useAdminList";
import { AdminDataTable, type Column } from "@/components/admin/AdminDataTable";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Drawer } from "@/components/admin/Drawer";
import { UserForm } from "./UserForm";
import { listUsers, resendInvite, deactivateUser, reactivateUser, sendPasswordReset, type UserRow } from "./actions";

const statusStyles: Record<string, string> = {
  ACTIVE: "bg-emerald-400/15 text-emerald-300",
  INVITED: "bg-gold/15 text-gold",
  DEACTIVATED: "bg-white/8 text-white/40",
};

export function UsersManager({ currentUserId, permissions }: { currentUserId: string; permissions: { create: boolean; edit: boolean } }) {
  const list = useAdminList<UserRow>(listUsers);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [deactivating, setDeactivating] = useState<UserRow | null>(null);

  function onFormSuccess() {
    setDrawerOpen(false);
    list.refresh();
  }

  async function handleDeactivate() {
    if (!deactivating) return;
    try {
      await deactivateUser(deactivating.id);
      toast.success(`${deactivating.name} deactivated`);
      list.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setDeactivating(null);
    }
  }

  async function handleReactivate(row: UserRow) {
    await reactivateUser(row.id);
    toast.success(`${row.name} reactivated`);
    list.refresh();
  }

  async function handleResendInvite(row: UserRow) {
    try {
      await resendInvite(row.id);
      toast.success(`Invite resent to ${row.email}`);
    } catch {
      toast.error("Failed to resend invite");
    }
  }

  async function handlePasswordReset(row: UserRow) {
    try {
      await sendPasswordReset(row.id);
      toast.success(`Password reset link sent to ${row.email}`);
    } catch {
      toast.error("Failed to send reset link");
    }
  }

  const columns: Column<UserRow>[] = [
    {
      key: "name",
      label: "User",
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-medium text-white">{row.name}{row.id === currentUserId && <span className="ml-1.5 text-xs text-white/30">(you)</span>}</p>
          <p className="text-xs text-white/35">{row.email}</p>
        </div>
      ),
    },
    { key: "role", label: "Role", render: (row) => <span className="rounded-full bg-white/8 px-2.5 py-1 text-xs text-white/60">{row.role.replace("_", " ")}</span> },
    { key: "status", label: "Status", render: (row) => <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[row.status]}`}>{row.status}</span> },
    { key: "lastLogin", label: "Last Login", sortable: true, render: (row) => <span className="text-white/50">{row.lastLogin ? new Date(row.lastLogin).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "Never"}</span> },
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
        hideTrashToggle
        onEdit={permissions.edit ? (row) => { setEditing(row); setDrawerOpen(true); } : undefined}
        emptyMessage="No users yet."
        searchPlaceholder="Search name or email…"
        rowActions={(row) =>
          permissions.edit && row.id !== currentUserId ? (
            <>
              {row.status === "INVITED" && (
                <button onClick={() => handleResendInvite(row)} aria-label="Resend invite" className="rounded-lg p-1.5 text-white/40 hover:bg-white/8 hover:text-white">
                  <Mail className="h-3.5 w-3.5" />
                </button>
              )}
              {row.status === "ACTIVE" && (
                <button onClick={() => handlePasswordReset(row)} aria-label="Send password reset" className="rounded-lg p-1.5 text-white/40 hover:bg-white/8 hover:text-white">
                  <KeyRound className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                onClick={() => (row.status === "DEACTIVATED" ? handleReactivate(row) : setDeactivating(row))}
                aria-label={row.status === "DEACTIVATED" ? "Reactivate" : "Deactivate"}
                className={`rounded-lg p-1.5 ${row.status === "DEACTIVATED" ? "text-emerald-400 hover:bg-emerald-400/10" : "text-red-400 hover:bg-red-400/10"}`}
              >
                <Power className="h-3.5 w-3.5" />
              </button>
            </>
          ) : null
        }
        toolbar={
          permissions.create && (
            <button onClick={() => { setEditing(null); setDrawerOpen(true); }} className="ml-auto flex items-center gap-2 rounded-xl bg-gold px-4 py-2.5 text-sm font-semibold text-ivory hover:bg-gold-deep">
              <UserPlus className="h-4 w-4" /> Invite User
            </button>
          )
        }
      />

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={editing ? "Edit User" : "Invite User"}>
        <UserForm user={editing} onSuccess={onFormSuccess} />
      </Drawer>

      <ConfirmDialog
        open={!!deactivating}
        title="Deactivate this user?"
        description={`${deactivating?.name} will immediately lose access to the admin panel.`}
        confirmLabel="Deactivate"
        onConfirm={handleDeactivate}
        onCancel={() => setDeactivating(null)}
      />
    </>
  );
}
