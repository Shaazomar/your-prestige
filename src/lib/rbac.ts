import { auth } from "@/lib/auth";
import { can, type Module, type Action } from "@/lib/permissions";

export type { Module, Action } from "@/lib/permissions";
export { can, permissionsFor } from "@/lib/permissions";

/** Server-side guard for Server Actions / Route Handlers. Throws if denied. */
export async function requirePermission(module: Module, action: Action) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("UNAUTHENTICATED");
  }
  if (!can(session.user.role, module, action)) {
    throw new Error("FORBIDDEN");
  }
  return session;
}
