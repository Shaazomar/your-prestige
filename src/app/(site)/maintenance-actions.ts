"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyMaintenancePassword, issueBypassToken, MAINTENANCE_COOKIE } from "@/lib/maintenance";

export interface BypassState {
  error?: string;
}

export async function verifyBypassAction(_prev: BypassState | null, formData: FormData): Promise<BypassState> {
  const password = formData.get("password");
  if (typeof password !== "string" || !password) return { error: "Enter the preview password." };

  const valid = await verifyMaintenancePassword(password);
  if (!valid) return { error: "Incorrect password." };

  const store = await cookies();
  store.set(MAINTENANCE_COOKIE, issueBypassToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24h
    path: "/",
  });

  redirect("/");
}
