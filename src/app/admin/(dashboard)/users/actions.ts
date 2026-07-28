"use server";

import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { sendEmail } from "@/lib/email";
import type { ListParams, ListResult } from "@/hooks/useAdminList";
import { inviteUserSchema, type InviteUserInput, editUserSchema, type EditUserInput } from "./schema";
import type { Prisma, User } from "@prisma/client";

export type UserRow = Omit<User, "password" | "inviteToken" | "resetToken">;

function scrub(user: User): UserRow {
  const { password, inviteToken, resetToken, ...rest } = user;
  void password;
  void inviteToken;
  void resetToken;
  return rest;
}

export async function listUsers(params: ListParams): Promise<ListResult<UserRow>> {
  await requirePermission("users", "view");

  const where: Prisma.UserWhereInput = params.search
    ? { OR: [{ name: { contains: params.search, mode: "insensitive" } }, { email: { contains: params.search, mode: "insensitive" } }] }
    : {};

  const [rows, total] = await Promise.all([
    prisma.user.findMany({ where, orderBy: { [params.sortBy]: params.sortDir }, skip: (params.page - 1) * params.pageSize, take: params.pageSize }),
    prisma.user.count({ where }),
  ]);

  return { rows: rows.map(scrub), total };
}

export async function inviteUser(input: InviteUserInput) {
  const session = await requirePermission("users", "create");
  const data = inviteUserSchema.parse(input);

  const existing = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
  if (existing) throw new Error("A user with this email already exists.");

  const inviteToken = randomBytes(24).toString("hex");
  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email.toLowerCase(),
      role: data.role,
      status: "INVITED",
      password: randomBytes(24).toString("hex"), // placeholder, unusable until invite accepted
      inviteToken,
      inviteExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  const acceptUrl = `${process.env.AUTH_URL ?? "http://localhost:3000"}/admin/accept-invite?token=${inviteToken}`;
  await sendEmail({
    to: user.email,
    subject: "You've been invited to Your Prestige Admin",
    html: `<p>Hi ${user.name},</p><p>You've been invited as ${data.role.replace("_", " ")}. <a href="${acceptUrl}">Accept your invite</a> to set a password.</p>`,
  });

  await logAudit({ action: "user.invite", entity: "User", entityId: user.id, newValue: { email: user.email, role: user.role }, meta: { by: session.user.id } });
  return scrub(user);
}

export async function resendInvite(id: string) {
  const session = await requirePermission("users", "create");
  const inviteToken = randomBytes(24).toString("hex");
  const user = await prisma.user.update({
    where: { id },
    data: { inviteToken, inviteExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
  });

  const acceptUrl = `${process.env.AUTH_URL ?? "http://localhost:3000"}/admin/accept-invite?token=${inviteToken}`;
  await sendEmail({
    to: user.email,
    subject: "Your Your Prestige Admin invite",
    html: `<p>Hi ${user.name},</p><p><a href="${acceptUrl}">Accept your invite</a> to set a password.</p>`,
  });

  await logAudit({ action: "user.resend_invite", entity: "User", entityId: id, meta: { by: session.user.id } });
  return scrub(user);
}

export async function updateUser(id: string, input: EditUserInput) {
  const session = await requirePermission("users", "edit");
  const data = editUserSchema.parse(input);
  const before = await prisma.user.findUniqueOrThrow({ where: { id } });
  const user = await prisma.user.update({ where: { id }, data });
  await logAudit({
    action: "user.update",
    entity: "User",
    entityId: id,
    oldValue: { name: before.name, role: before.role },
    newValue: { name: user.name, role: user.role },
    meta: { by: session.user.id },
  });
  return scrub(user);
}

export async function deactivateUser(id: string) {
  const session = await requirePermission("users", "edit");
  if (id === session.user.id) throw new Error("You cannot deactivate your own account.");
  const user = await prisma.user.update({ where: { id }, data: { status: "DEACTIVATED" } });
  await logAudit({ action: "user.deactivate", entity: "User", entityId: id, meta: { by: session.user.id } });
  return scrub(user);
}

export async function reactivateUser(id: string) {
  const session = await requirePermission("users", "edit");
  const user = await prisma.user.update({ where: { id }, data: { status: "ACTIVE" } });
  await logAudit({ action: "user.reactivate", entity: "User", entityId: id, meta: { by: session.user.id } });
  return scrub(user);
}

export async function sendPasswordReset(id: string) {
  const session = await requirePermission("users", "edit");
  const resetToken = randomBytes(24).toString("hex");
  const user = await prisma.user.update({
    where: { id },
    data: { resetToken, resetExpiresAt: new Date(Date.now() + 60 * 60 * 1000) },
  });

  const resetUrl = `${process.env.AUTH_URL ?? "http://localhost:3000"}/admin/reset-password?token=${resetToken}`;
  await sendEmail({
    to: user.email,
    subject: "Reset your Your Prestige Admin password",
    html: `<p>Hi ${user.name},</p><p><a href="${resetUrl}">Reset your password</a>. This link expires in 1 hour.</p>`,
  });

  await logAudit({ action: "user.password_reset_sent", entity: "User", entityId: id, meta: { by: session.user.id } });
}
