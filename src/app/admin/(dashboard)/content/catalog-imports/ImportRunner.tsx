"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Play, Loader2, RotateCcw, XCircle, AlertTriangle } from "lucide-react";
import { runImportStep, startImport, retryImport, cancelImport } from "./actions";
import { RUNNING_STATUSES, STATUS_LABELS, STATUS_STYLES } from "./status";
import type { ImportProgress } from "@/lib/import/types";
import type { CatalogImport } from "@prisma/client";

/**
 * Drives the import state machine from the browser.
 *
 * This project has no queue and no background worker, and a catalogue takes
 * minutes — well past any single serverless request. So the work is sliced:
 * each `runImportStep` call does ~20 seconds of work, commits its cursor, and
 * returns progress. This component simply keeps calling until it's told to stop.
 *
 * Because all state lives in Postgres, closing the tab pauses the import rather
 * than losing it — reopening this page shows Resume and continues from the same
 * page. That's stated in the UI so nobody wonders whether they can walk away.
 */
export function ImportRunner({ job }: { job: CatalogImport }) {
  const router = useRouter();
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [running, setRunning] = useState(false);
  const cancelled = useRef(false);

  const isRunning = RUNNING_STATUSES.includes(job.status);
  const status = progress?.status ?? job.status;
  const processed = progress?.processed ?? job.processed;
  const total = progress?.total ?? job.total;
  const message = progress?.phase ?? job.phaseMessage ?? "";
  const pct = total > 0 ? Math.min(100, Math.round((processed / total) * 100)) : 0;

  const drive = useCallback(async () => {
    setRunning(true);
    cancelled.current = false;
    try {
      // Strictly sequential — two concurrent slices would fight over the lock
      // and waste a round trip each time.
      for (;;) {
        if (cancelled.current) break;
        const next = await runImportStep(job.id);
        setProgress(next);

        if (next.busy) {
          await new Promise((r) => setTimeout(r, 3000));
          continue;
        }
        if (next.done) {
          router.refresh();
          if (next.status === "READY") toast.success("Extraction complete — ready for review.");
          else if (next.status === "FAILED") toast.error(next.error ?? "Import failed.");
          break;
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import step failed");
    } finally {
      setRunning(false);
      router.refresh();
    }
  }, [job.id, router]);

  // Pick a paused import back up automatically — an admin who returns to this
  // page after closing the tab shouldn't have to know it stopped.
  useEffect(() => {
    if (isRunning && !running) void drive();
    return () => {
      cancelled.current = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleStart() {
    await startImport(job.id);
    router.refresh();
    void drive();
  }

  async function handleRetry() {
    await retryImport(job.id);
    router.refresh();
    void drive();
  }

  async function handleCancel() {
    cancelled.current = true;
    await cancelImport(job.id);
    router.refresh();
    toast.info("Import cancelled");
  }

  return (
    <div className="rounded-2xl border border-white/8 bg-[#141413] p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <span className={`rounded-full px-2.5 py-1 text-[0.65rem] font-semibold ${STATUS_STYLES[status]}`}>
              {STATUS_LABELS[status]}
            </span>
            {(running || isRunning) && <Loader2 className="h-4 w-4 animate-spin text-gold" />}
          </div>
          {message && <p className="mt-2 text-sm text-white/60">{message}</p>}
        </div>

        <div className="flex items-center gap-2">
          {status === "UPLOADED" && (
            <button
              onClick={handleStart}
              className="inline-flex items-center gap-2 rounded-lg bg-gold px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-gold-deep"
            >
              <Play className="h-4 w-4" /> Start Processing
            </button>
          )}
          {RUNNING_STATUSES.includes(status) && !running && (
            <button
              onClick={() => void drive()}
              className="inline-flex items-center gap-2 rounded-lg bg-gold px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-gold-deep"
            >
              <Play className="h-4 w-4" /> Resume
            </button>
          )}
          {status === "FAILED" && (
            <button
              onClick={handleRetry}
              className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-4 py-2 text-sm font-medium transition-colors hover:border-gold/40"
            >
              <RotateCcw className="h-4 w-4" /> Retry from page {job.cursor + 1}
            </button>
          )}
          {(running || RUNNING_STATUSES.includes(status)) && (
            <button
              onClick={handleCancel}
              className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-4 py-2 text-sm transition-colors hover:border-red-400/40 hover:text-red-300"
            >
              <XCircle className="h-4 w-4" /> Cancel
            </button>
          )}
        </div>
      </div>

      {total > 0 && RUNNING_STATUSES.includes(status) && (
        <div className="mt-5">
          <div className="h-1.5 overflow-hidden rounded-full bg-white/8">
            <div className="h-full rounded-full bg-gold transition-[width] duration-500" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-2 text-xs text-white/35">
            {processed} of {total} · keep this tab open while it runs — progress is saved continuously, so
            closing it pauses rather than loses the import.
          </p>
        </div>
      )}

      {job.error && status === "FAILED" && (
        <div className="mt-5 flex gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
          <AlertTriangle className="h-4 w-4 shrink-0 text-red-300" />
          <div className="min-w-0 text-sm">
            <p className="font-medium text-red-300">Import stopped</p>
            <p className="mt-1 break-words text-white/50">{job.error}</p>
          </div>
        </div>
      )}

      {job.isScanned && (
        <div className="mt-5 flex gap-3 rounded-xl border border-amber-400/20 bg-amber-400/5 p-4">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-300" />
          <div className="text-sm">
            <p className="font-medium text-amber-300">This looks like a scanned catalogue</p>
            <p className="mt-1 text-white/50">
              Pages are single full-page images rather than text and separate photographs, so per-product
              image extraction isn&apos;t possible here. Product details will need to be entered by hand.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
