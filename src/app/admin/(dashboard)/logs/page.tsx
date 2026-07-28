import { LogsManager } from "./LogsManager";

export const metadata = { title: "Audit Logs" };

export default function LogsPage() {
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
