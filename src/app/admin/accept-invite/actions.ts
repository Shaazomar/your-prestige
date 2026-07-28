"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

export interface AcceptInviteState {
  error?: string;
}

export async function acceptInviteAction(
  _prev: AcceptInviteState | null,
  formData: FormData
): Promise<AcceptInviteState> {
  const token = formData.get("token");
  const password = formData.get("password");
  const confirmPassword = formData.get("confirmPassword");

  if (typeof token !== "string" || !token) return { error: "Invalid invite link." };
  if (typeof password !== "string" || password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (password !== confirmPassword) return { error: "Passwords don't match." };

  const user = await prisma.user.findUnique({ where: { inviteToken: token } });
  if (!user || !user.inviteExpiresAt || user.inviteExpiresAt < new Date()) {
    return { error: "This invite link is invalid or has expired." };
  }

  const hash = await bcrypt.hash(password, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hash, status: "ACTIVE", inviteToken: null, inviteExpiresAt: null },
  });

  await logAudit({ action: "user.accept_invite", entity: "User", entityId: user.id });
  redirect("/admin/login?invited=1");
}
