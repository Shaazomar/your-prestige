import { auth } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { PermissionMatrix } from "@/components/admin/PermissionMatrix";
import { UsersManager } from "./UsersManager";

export const metadata = { title: "Users & Roles" };

export default async function UsersPage() {
  const session = await auth();
  const role = session!.user.role;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Users & Roles</h1>
        <p className="mt-1 text-sm text-white/40">
          Invite teammates, manage roles, and review the permission matrix.
        </p>
      </div>
      <UsersManager
        currentUserId={session!.user.id}
        permissions={{
          create: can(role, "users", "create"),
          edit: can(role, "users", "edit"),
        }}
      />
      <PermissionMatrix />
    </div>
  );
}
