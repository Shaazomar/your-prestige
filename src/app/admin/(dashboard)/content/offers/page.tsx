import { auth } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { OffersManager } from "./OffersManager";

export const metadata = { title: "Offers" };

export default async function OffersPage() {
  const session = await auth();
  const role = session!.user.role;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Offers</h1>
        <p className="mt-1 text-sm text-white/40">
          Seasonal privileges with validity windows and countdown timers.
        </p>
      </div>
      <OffersManager
        permissions={{
          create: can(role, "offers", "create"),
          edit: can(role, "offers", "edit"),
          delete: can(role, "offers", "delete"),
        }}
      />
    </div>
  );
}
