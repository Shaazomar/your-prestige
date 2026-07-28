import { auth } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { ShowroomsManager } from "./ShowroomsManager";

export const metadata = { title: "Showrooms" };

export default async function ShowroomsPage() {
  const session = await auth();
  const role = session!.user.role;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Showrooms</h1>
        <p className="mt-1 text-sm text-white/40">
          Every branch — address, hours, gallery, brands stocked and map pin. Changes go
          live on the website immediately.
        </p>
      </div>
      <ShowroomsManager
        permissions={{
          create: can(role, "showrooms", "create"),
          edit: can(role, "showrooms", "edit"),
          delete: can(role, "showrooms", "delete"),
        }}
      />
    </div>
  );
}
