import { auth } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { ConversationsManager } from "./ConversationsManager";

export const metadata = { title: "AI Conversations" };

export default async function ConversationsPage() {
  const session = await auth();
  const role = session!.user.role;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">AI Conversations</h1>
        <p className="mt-1 text-sm text-white/40">
          Every concierge chat is logged here — review transcripts and extract leads.
        </p>
      </div>
      <ConversationsManager
        permissions={{
          edit: can(role, "conversations", "edit"),
          delete: can(role, "conversations", "delete"),
        }}
      />
    </div>
  );
}
