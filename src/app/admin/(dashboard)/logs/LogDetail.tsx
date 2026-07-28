"use client";

import { X } from "lucide-react";
import type { AuditLogRow } from "./actions";

export function LogDetail({ log, onClose }: { log: AuditLogRow | null; onClose: () => void }) {
  if (!log) return null;

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <button className="absolute inset-0" aria-label="Close" onClick={onClose} />
      <div className="relative flex max-h-[85vh] w-full max-w-lg flex-col rounded-2xl border border-white/10 bg-[#141413] text-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
          <h3 className="font-mono text-sm font-semibold text-gold">{log.action}</h3>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-white/50 hover:bg-white/8 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4 text-sm">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div><p className="text-white/30">Timestamp</p><p className="text-white/80">{new Date(log.createdAt).toLocaleString("en-IN")}</p></div>
            <div><p className="text-white/30">User</p><p className="text-white/80">{log.user?.name ?? "System"}</p></div>
            <div><p className="text-white/30">Role</p><p className="text-white/80">{log.roleAtTime ?? "—"}</p></div>
            <div><p className="text-white/30">Entity</p><p className="text-white/80">{log.entity ?? "—"} {log.entityId && `(${log.entityId.slice(0, 10)}…)`}</p></div>
            <div><p className="text-white/30">IP Address</p><p className="font-mono text-white/80">{log.ipAddress ?? "—"}</p></div>
            <div className="col-span-2"><p className="text-white/30">Browser / Device</p><p className="truncate text-white/80">{log.userAgent ?? "—"}</p></div>
          </div>
          {log.oldValue !== null && (
            <div>
              <p className="mb-1.5 text-xs text-white/30">Old Value</p>
              <pre className="overflow-x-auto rounded-lg bg-white/5 p-3 text-[0.7rem] text-white/60">{JSON.stringify(log.oldValue, null, 2)}</pre>
            </div>
          )}
          {log.newValue !== null && (
            <div>
              <p className="mb-1.5 text-xs text-white/30">New Value</p>
              <pre className="overflow-x-auto rounded-lg bg-white/5 p-3 text-[0.7rem] text-white/60">{JSON.stringify(log.newValue, null, 2)}</pre>
            </div>
          )}
          {log.meta !== null && (
            <div>
              <p className="mb-1.5 text-xs text-white/30">Meta</p>
              <pre className="overflow-x-auto rounded-lg bg-white/5 p-3 text-[0.7rem] text-white/60">{JSON.stringify(log.meta, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
