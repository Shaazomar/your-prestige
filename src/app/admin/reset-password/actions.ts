"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

export interface ResetPasswordState {
  error?: string;
}

export async function resetPasswordAction(
  _prev: ResetPasswordState | null,
  formData: FormData
): Promise<ResetPasswordState> {
  const token = formData.get("token");
  const password = formData.get("password");
  const confirmPassword = formData.get("confirmPassword");

  if (typeof token !== "string" || !token) return { error: "Invalid reset link." };
  if (typeof password !== "string" || password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (password !== confirmPassword) return { error: "Passwords don't match." };

  const user = await prisma.user.findUnique({ where: { resetToken: token } });
  if (!user || !user.resetExpiresAt || user.resetExpiresAt < new Date()) {
    return { error: "This reset link is invalid or has expired." };
  }

  const hash = await bcrypt.hash(password, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hash, resetToken: null, resetExpiresAt: null },
  });

  await logAudit({ action: "user.password_reset_completed", entity: "User", entityId: user.id });
  redirect("/admin/login?reset=1");
}
