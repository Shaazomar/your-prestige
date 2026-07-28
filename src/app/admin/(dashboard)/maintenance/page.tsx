import { auth } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { MaintenanceManager } from "./MaintenanceManager";

export const metadata = { title: "Maintenance" };

export default async function MaintenancePage() {
  const session = await auth();
  const role = session!.user.role;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Maintenance</h1>
        <p className="mt-1 text-sm text-white/40">
          Take the public site offline with a branded holding page.
        </p>
      </div>
      <MaintenanceManager canEdit={can(role, "maintenance", "settings")} />
    </div>
  );
}
