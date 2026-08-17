import { permissionsFor, type Action, type Module } from "@/lib/permissions";
import type { Role } from "@prisma/client";

const roles: Role[] = [
  "SUPER_ADMIN", "MANAGER", "SHOWROOM_INCHARGE", "SHOWROOM_STAFF", "DEALER", "VIEWER",
];
const modules: Module[] = [
  "products", "categories", "brands", "inventory", "dealers", "showrooms",
  "portfolio", "gallery", "videos", "testimonials",
  "blog", "faqs", "offers", "leads", "bookings", "conversations", "media", "seo",
  "users", "settings", "analytics", "logs",
];
const actionDots: Action[] = ["view", "create", "edit", "delete", "publish"];

/** Read-only reference view of the code-defined RBAC matrix — see src/lib/rbac.ts. */
export function PermissionMatrix() {
  return (
    <div className="overflow-x-auto rounded-2xl border border-white/8 bg-[#141413] p-5">
      <p className="mb-4 text-sm font-medium text-white/70">Permission Matrix</p>
      <table className="w-full min-w-[820px] text-left text-xs">
        <thead>
          <tr className="border-b border-white/8 text-white/35">
            <th className="py-2 pr-4">Module</th>
            {roles.map((r) => (
              <th key={r} className="px-2 py-2 text-center font-medium">{r.replace("_", " ")}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {modules.map((m) => (
            <tr key={m} className="border-b border-white/5 last:border-0">
              <td className="py-2 pr-4 capitalize text-white/60">{m}</td>
              {roles.map((r) => {
                const actions = permissionsFor(r)[m] ?? [];
                return (
                  <td key={r} className="px-2 py-2 text-center">
                    <span className="inline-flex gap-0.5">
                      {actionDots.map((a) => (
                        <span
                          key={a}
                          title={a}
                          className={`h-1.5 w-1.5 rounded-full ${actions.includes(a) ? "bg-gold" : "bg-white/10"}`}
                        />
                      ))}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 text-[0.65rem] text-white/25">Dots left→right: view · create · edit · delete · publish</p>
    </div>
  );
}
