"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import type { ListParams, ListResult } from "@/hooks/useAdminList";
import { Prisma } from "@prisma/client";
import type { Conversation } from "@prisma/client";

interface StoredMessage {
  role: "user" | "assistant";
  content: string;
  at: string;
}

export type ConversationRow = Conversation & { preview: string; messageCount: number };

function summarize(c: Conversation): ConversationRow {
  const messages = (c.messages as unknown as StoredMessage[]) ?? [];
  const firstUserMsg = messages.find((m) => m.role === "user");
  return { ...c, preview: firstUserMsg?.content ?? "(no messages)", messageCount: messages.length };
}

export async function listConversations(params: ListParams): Promise<ListResult<ConversationRow>> {
  await requirePermission("conversations", "view");

  const deletedClause = params.trash ? Prisma.sql`"deletedAt" IS NOT NULL` : Prisma.sql`"deletedAt" IS NULL`;
  const searchClause = params.search
    ? Prisma.sql`AND ("sessionId" ILIKE ${"%" + params.search + "%"} OR "messages"::text ILIKE ${"%" + params.search + "%"})`
    : Prisma.empty;

  const sortColumn = ["createdAt", "updatedAt"].includes(params.sortBy) ? params.sortBy : "updatedAt";
  const orderClause = params.sortDir === "asc" ? Prisma.sql`ASC` : Prisma.sql`DESC`;

  const rows = await prisma.$queryRaw<Conversation[]>(Prisma.sql`
    SELECT * FROM "Conversation"
    WHERE ${deletedClause} ${searchClause}
    ORDER BY "${Prisma.raw(sortColumn)}" ${orderClause}
    LIMIT ${params.pageSize} OFFSET ${(params.page - 1) * params.pageSize}
  `);

  const countResult = await prisma.$queryRaw<{ count: bigint }[]>(Prisma.sql`
    SELECT COUNT(*) as count FROM "Conversation" WHERE ${deletedClause} ${searchClause}
  `);

  return { rows: rows.map(summarize), total: Number(countResult[0]?.count ?? 0) };
}

export async function getConversation(id: string) {
  await requirePermission("conversations", "view");
  const conversation = await prisma.conversation.findUniqueOrThrow({ where: { id } });
  return { ...conversation, messages: (conversation.messages as unknown as StoredMessage[]) ?? [] };
}

export async function toggleResolved(id: string, resolved: boolean) {
  await requirePermission("conversations", "edit");
  const conversation = await prisma.conversation.update({ where: { id }, data: { resolved } });
  await logAudit({ action: "conversation.resolve", entity: "Conversation", entityId: id, newValue: { resolved } });
  return conversation;
}

export async function extractLeadFromConversation(id: string) {
  const session = await requirePermission("conversations", "edit");
  const conversation = await prisma.conversation.findUniqueOrThrow({ where: { id } });
  if (conversation.leadId) throw new Error("A lead has already been extracted from this conversation.");

  const messages = (conversation.messages as unknown as StoredMessage[]) ?? [];
  const phoneMatch = messages.map((m) => m.content).join(" ").match(/(\+?\d[\d\s-]{8,14}\d)/);
  const firstMessage = messages.find((m) => m.role === "user")?.content ?? "";

  const lead = await prisma.lead.create({
    data: {
      type: "CONCIERGE",
      name: "Concierge Visitor",
      phone: phoneMatch?.[0]?.trim() ?? "Unknown",
      message: firstMessage,
      source: "concierge",
    },
  });

  await prisma.conversation.update({ where: { id }, data: { leadId: lead.id, leadExtracted: true } });
  await logAudit({ action: "conversation.extract_lead", entity: "Conversation", entityId: id, newValue: { leadId: lead.id }, meta: { by: session.user.id } });
  return lead;
}

export async function softDeleteConversation(id: string) {
  const session = await requirePermission("conversations", "delete");
  const conversation = await prisma.conversation.update({ where: { id }, data: { deletedAt: new Date() } });
  await logAudit({ action: "conversation.delete", entity: "Conversation", entityId: id, meta: { by: session.user.id } });
  return conversation;
}

export async function restoreConversation(id: string) {
  await requirePermission("conversations", "edit");
  const conversation = await prisma.conversation.update({ where: { id }, data: { deletedAt: null } });
  await logAudit({ action: "conversation.restore", entity: "Conversation", entityId: id });
  return conversation;
}

export async function exportConversationsCsv(): Promise<string> {
  await requirePermission("conversations", "view");
  const conversations = await prisma.conversation.findMany({ where: { deletedAt: null }, orderBy: { createdAt: "desc" } });

  const header = ["Session ID", "Created", "Messages", "Lead Extracted", "Resolved", "First Message"];
  const rows = conversations.map((c) => {
    const messages = (c.messages as unknown as StoredMessage[]) ?? [];
    const first = messages.find((m) => m.role === "user")?.content ?? "";
    return [
      c.sessionId,
      c.createdAt.toISOString(),
      String(messages.length),
      c.leadExtracted ? "Yes" : "No",
      c.resolved ? "Yes" : "No",
      `"${first.replace(/"/g, '""')}"`,
    ].join(",");
  });

  return [header.join(","), ...rows].join("\n");
}
