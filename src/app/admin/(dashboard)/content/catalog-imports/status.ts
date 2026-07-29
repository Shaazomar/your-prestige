import type { ImportStatus, ExtractedStatus } from "@prisma/client";

/** Shared status presentation — the list, the detail header and the runner all use these. */

export const STATUS_LABELS: Record<ImportStatus, string> = {
  UPLOADED: "Ready to start",
  ANALYZING: "Reading text",
  EXTRACTING: "Finding products",
  IMAGING: "Extracting images",
  LINKING: "Matching images",
  ENRICHING: "Composing details",
  READY: "Awaiting review",
  PUBLISHING: "Publishing",
  COMPLETED: "Completed",
  FAILED: "Failed",
  CANCELLED: "Cancelled",
};

export const STATUS_STYLES: Record<ImportStatus, string> = {
  UPLOADED: "bg-white/8 text-white/60",
  ANALYZING: "bg-sky-400/15 text-sky-300",
  EXTRACTING: "bg-sky-400/15 text-sky-300",
  IMAGING: "bg-violet-400/15 text-violet-300",
  LINKING: "bg-violet-400/15 text-violet-300",
  ENRICHING: "bg-amber-400/15 text-amber-300",
  READY: "bg-gold/15 text-gold",
  PUBLISHING: "bg-amber-400/15 text-amber-300",
  COMPLETED: "bg-emerald-500/20 text-emerald-300",
  FAILED: "bg-red-500/20 text-red-300",
  CANCELLED: "bg-white/8 text-white/40",
};

/** Phases where the machine is actively working and should keep being stepped. */
export const RUNNING_STATUSES: ImportStatus[] = [
  "ANALYZING", "EXTRACTING", "IMAGING", "LINKING", "ENRICHING",
];

export const EXTRACTED_STATUS_STYLES: Record<ExtractedStatus, string> = {
  PENDING: "bg-white/8 text-white/60",
  APPROVED: "bg-emerald-500/20 text-emerald-300",
  REJECTED: "bg-red-500/20 text-red-300",
  MERGED: "bg-violet-400/15 text-violet-300",
  PUBLISHED: "bg-gold/15 text-gold",
};
