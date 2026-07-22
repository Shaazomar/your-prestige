"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Phone, ChevronLeft, ChevronRight, CalendarClock } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LeadItem {
  id: string;
  name: string;
  phone: string;
  type: string;
  status: string;
  interest: string | null;
  message: string | null;
  visitDate: string | null;
  createdAt: string;
}

const columns = [
  { key: "NEW", label: "New", accent: "border-t-gold" },
  { key: "CONTACTED", label: "Contacted", accent: "border-t-sky-400" },
  { key: "QUALIFIED", label: "Qualified", accent: "border-t-violet-400" },
  { key: "VISITED", label: "Visited", accent: "border-t-emerald-400" },
  { key: "QUOTED", label: "Quoted", accent: "border-t-amber-400" },
  { key: "WON", label: "Won", accent: "border-t-emerald-500" },
  { key: "LOST", label: "Lost", accent: "border-t-white/20" },
] as const;

export function LeadsKanban({ initialLeads }: { initialLeads: LeadItem[] }) {
  const [leads, setLeads] = useState(initialLeads);

  async function move(lead: LeadItem, direction: 1 | -1) {
    const idx = columns.findIndex((c) => c.key === lead.status);
    const next = columns[idx + direction];
    if (!next) return;

    // Optimistic update
    setLeads((ls) =>
      ls.map((l) => (l.id === lead.id ? { ...l, status: next.key } : l))
    );
    const res = await fetch(`/api/admin/leads/${lead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next.key }),
    });
    if (!res.ok) {
      // Roll back on failure
      setLeads((ls) =>
        ls.map((l) => (l.id === lead.id ? { ...l, status: lead.status } : l))
      );
    }
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map((col) => {
        const items = leads.filter((l) => l.status === col.key);
        return (
          <div key={col.key} className="w-72 shrink-0">
            <div
              className={cn(
                "rounded-2xl border border-white/8 border-t-2 bg-[#141413]",
                col.accent
              )}
            >
              <div className="flex items-center justify-between px-4 py-3">
                <h3 className="text-sm font-semibold">{col.label}</h3>
                <span className="rounded-full bg-white/8 px-2 py-0.5 text-xs text-white/50">
                  {items.length}
                </span>
              </div>
              <div className="space-y-2.5 px-3 pb-3">
                {items.length === 0 && (
                  <p className="rounded-xl border border-dashed border-white/8 py-6 text-center text-xs text-white/25">
                    Empty
                  </p>
                )}
                {items.map((lead) => (
                  <motion.div
                    key={lead.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-white/8 bg-[#1b1b1a] p-4 transition-colors hover:border-gold/30"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium">{lead.name}</p>
                      <span className="shrink-0 rounded-full bg-white/8 px-2 py-0.5 text-[0.6rem] font-semibold text-white/50">
                        {lead.type}
                      </span>
                    </div>
                    <a
                      href={`tel:${lead.phone}`}
                      className="mt-1.5 flex items-center gap-1.5 text-xs text-white/45 hover:text-gold"
                    >
                      <Phone className="h-3 w-3" />
                      {lead.phone}
                    </a>
                    {lead.visitDate && (
                      <p className="mt-1.5 flex items-center gap-1.5 text-xs text-gold/80">
                        <CalendarClock className="h-3 w-3" />
                        {new Date(lead.visitDate).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                    )}
                    {lead.message && (
                      <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-white/35">
                        {lead.message}
                      </p>
                    )}
                    <div className="mt-3 flex items-center justify-between border-t border-white/6 pt-2.5">
                      <button
                        onClick={() => move(lead, -1)}
                        disabled={col.key === "NEW"}
                        aria-label="Move to previous stage"
                        className="rounded-lg p-1.5 text-white/40 transition-colors hover:bg-white/8 hover:text-white disabled:opacity-20"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <span className="text-[0.6rem] text-white/25">
                        {new Date(lead.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                      <button
                        onClick={() => move(lead, 1)}
                        disabled={col.key === "LOST"}
                        aria-label="Move to next stage"
                        className="rounded-lg p-1.5 text-white/40 transition-colors hover:bg-white/8 hover:text-white disabled:opacity-20"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
