"use client";

import { AlertCircle, RotateCw, X, CheckCircle2 } from "lucide-react";
import type { UploadItem } from "./useMediaUpload";

/**
 * The per-file feedback strip shared by every upload control.
 *
 * A failed upload stays on screen with its own reason and its own Retry —
 * previously a failure produced one transient toast that said "Upload failed"
 * and vanished, which is neither diagnosable nor recoverable. Errors here name
 * the file and the cause and persist until dismissed.
 */
export function UploadQueue({
  items,
  onRetry,
  onCancel,
  onDismiss,
}: {
  items: UploadItem[];
  onRetry: (id: string) => void;
  onCancel: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  if (items.length === 0) return null;

  return (
    <ul className="mt-2 space-y-1.5">
      {items.map((item) => (
        <li
          key={item.id}
          className={
            item.status === "error"
              ? "rounded-lg border border-red-500/40 bg-red-500/10 p-2.5 text-xs"
              : "rounded-lg border border-white/10 bg-white/5 p-2.5 text-xs"
          }
        >
          <div className="flex items-center gap-2">
            {item.status === "error" ? (
              <AlertCircle className="h-3.5 w-3.5 shrink-0 text-red-400" />
            ) : item.status === "done" ? (
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
            ) : null}

            <span className="min-w-0 flex-1 truncate text-white/70" title={item.name}>
              {item.name}
            </span>

            {item.status === "uploading" && (
              <span className="tabular-nums text-white/50">{item.percent}%</span>
            )}

            {item.status === "error" && (
              <button
                type="button"
                onClick={() => onRetry(item.id)}
                className="flex items-center gap-1 rounded px-1.5 py-0.5 font-semibold text-red-200 transition-colors hover:bg-red-500/20"
              >
                <RotateCw className="h-3 w-3" />
                Retry
              </button>
            )}

            {item.status === "uploading" ? (
              <button
                type="button"
                onClick={() => onCancel(item.id)}
                className="rounded p-0.5 text-white/40 transition-colors hover:text-white"
                aria-label={`Cancel upload of ${item.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onDismiss(item.id)}
                className="rounded p-0.5 text-white/40 transition-colors hover:text-white"
                aria-label={`Dismiss ${item.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {(item.status === "uploading" || item.status === "queued") && (
            <div
              className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/10"
              role="progressbar"
              aria-valuenow={item.percent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Uploading ${item.name}`}
            >
              <div
                className="h-full rounded-full bg-gold transition-[width] duration-200"
                style={{ width: `${item.percent}%` }}
              />
            </div>
          )}

          {item.error && <p className="mt-1.5 leading-snug text-red-200">{item.error}</p>}
        </li>
      ))}
    </ul>
  );
}
