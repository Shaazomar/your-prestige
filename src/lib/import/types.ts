import type { ImportStatus } from "@prisma/client";

/** What a single slice of work reports back to the browser driving it. */
export interface ImportProgress {
  status: ImportStatus;
  /** Human-readable description of what just happened. */
  phase: string;
  processed: number;
  total: number;
  /** True when the machine has reached a state that needs a human, or is finished. */
  done: boolean;
  /** Set when another tab holds the lock — the caller should back off and retry. */
  busy?: boolean;
  error?: string | null;
}

/** Compact per-page text cached during ANALYZING, so only IMAGING reopens the PDF. */
export interface CachedPage {
  page: number;
  width: number;
  height: number;
  blocks: { text: string; x: number; y: number; w: number; h: number }[];
}

export interface ImportStats {
  productsFound: number;
  imagesKept: number;
  imagesRejected: number;
  duplicates: number;
  scannedPages: number;
  failures: number;
}

export const EMPTY_STATS: ImportStats = {
  productsFound: 0,
  imagesKept: 0,
  imagesRejected: 0,
  duplicates: 0,
  scannedPages: 0,
  failures: 0,
};

/**
 * Wall-clock budget for one slice. Sized well under the 60s serverless ceiling
 * so a slice always commits its cursor rather than being killed mid-page.
 */
export const SLICE_BUDGET_MS = Number(process.env.IMPORT_SLICE_MS ?? 20_000);

/**
 * Decoded-pixel budget per IMAGING slice. Memory, not page count, is the
 * binding constraint — one 3000x2000 RGBA bitmap is 24 MB on its own.
 */
export const IMAGING_BYTE_BUDGET = 150 * 1024 * 1024;

/** A lock older than this is assumed dead (tab closed, process restarted). */
export const LOCK_TTL_MS = 2 * 60 * 1000;

/** Give up on a page after this many consecutive failures at the same cursor. */
export const MAX_ATTEMPTS = 3;
