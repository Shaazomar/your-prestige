import { auth } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { SettingsManager } from "./SettingsManager";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await auth();
  const role = session!.user.role;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-white/40">
          Business details, theme, and integration status.
        </p>
      </div>
      <SettingsManager canEdit={can(role, "settings", "settings")} />
    </div>
  );
}
