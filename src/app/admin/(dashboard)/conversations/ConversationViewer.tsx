"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { X, UserPlus, CheckCircle2, Loader2 } from "lucide-react";
import { getConversation, toggleResolved, extractLeadFromConversation } from "./actions";
import { cn } from "@/lib/utils";

interface StoredMessage {
  role: "user" | "assistant";
  content: string;
  at: string;
}

export function ConversationViewer({
  id,
  onClose,
  onChanged,
  canEdit,
}: {
  id: string | null;
  onClose: () => void;
  onChanged: () => void;
  canEdit: boolean;
}) {
  const [messages, setMessages] = useState<StoredMessage[]>([]);
  const [resolved, setResolved] = useState(false);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [extracting, setExtracting] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getConversation(id).then((c) => {
      setMessages(c.messages);
      setResolved(c.resolved);
      setLeadId(c.leadId);
      setLoading(false);
    });
  }, [id]);

  if (!id) return null;

  async function handleResolveToggle() {
    if (!id) return;
    const next = !resolved;
    setResolved(next);
    await toggleResolved(id, next);
    onChanged();
  }

  async function handleExtractLead() {
    if (!id) return;
    setExtracting(true);
    try {
      const lead = await extractLeadFromConversation(id);
      setLeadId(lead.id);
      toast.success("Lead created from this conversation");
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to extract lead");
    } finally {
      setExtracting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <button className="absolute inset-0" aria-label="Close" onClick={onClose} />
      <div className="relative flex max-h-[85vh] w-full max-w-lg flex-col rounded-2xl border border-white/10 bg-[#141413] text-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
          <h3 className="font-semibold">Conversation</h3>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-white/50 hover:bg-white/8 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-white/30" />
            </div>
          ) : (
            messages.map((m, i) => (
              <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                <div className={cn("max-w-[80%] rounded-xl px-3.5 py-2.5 text-sm", m.role === "user" ? "bg-gold/15 text-white" : "bg-white/5 text-white/80")}>
                  {m.content}
                  <p className="mt-1 text-[0.6rem] text-white/25">{new Date(m.at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {canEdit && (
          <div className="flex items-center justify-between gap-2 border-t border-white/8 px-5 py-4">
            <button onClick={handleResolveToggle} className={cn("flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium", resolved ? "bg-emerald-400/15 text-emerald-300" : "bg-white/8 text-white/60")}>
              <CheckCircle2 className="h-3.5 w-3.5" />
              {resolved ? "Resolved" : "Mark Resolved"}
            </button>
            <button
              onClick={handleExtractLead}
              disabled={!!leadId || extracting}
              className="flex items-center gap-1.5 rounded-lg bg-gold px-3 py-2 text-xs font-semibold text-ivory disabled:opacity-50"
            >
              <UserPlus className="h-3.5 w-3.5" />
              {leadId ? "Lead Created" : extracting ? "Creating…" : "Extract Lead"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
