import { LogsManager } from "./LogsManager";
import { requirePermission } from "@/lib/rbac";

export const metadata = { title: "Audit Logs" };

export default async function LogsPage() {
  await requirePermission("logs", "view");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Audit Logs</h1>
        <p className="mt-1 text-sm text-white/40">
          Every create, update, delete, login and settings change — who, when, where.
        </p>
      </div>
      <LogsManager />
    </div>
  );
}
