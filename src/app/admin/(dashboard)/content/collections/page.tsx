import { auth } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { CollectionsManager } from "./CollectionsManager";

export const metadata = { title: "Collections" };

export default async function CollectionsPage() {
  const session = await auth();
  const role = session!.user.role;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Collections</h1>
        <p className="mt-1 text-sm text-white/40">
          Manage product collections — group tiles into cohesive collections or design series.
        </p>
      </div>
      <CollectionsManager
        permissions={{
          create: can(role, "collections", "create"),
          edit: can(role, "collections", "edit"),
          delete: can(role, "collections", "delete"),
        }}
      />
    </div>
  );
}
