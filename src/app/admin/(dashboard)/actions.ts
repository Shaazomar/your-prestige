"use server";

import { signOut } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function logoutAction() {
  await logAudit({ action: "auth.logout" });
  await signOut({ redirectTo: "/admin/login" });
}
