"use client";

import { useCallback, useRef, useState } from "react";
import {
  uploadMedia,
  validateFile,
  MediaUploadError,
  type UploadedMedia,
} from "@/lib/media/client";
import type { MediaScope } from "@/lib/media/keys";

/**
 * Upload state for one media field.
 *
 * Every CMS upload control shares this hook, so progress, cancellation, retry
 * and error text behave identically whether the editor is on a product, a
 * brand hero or a homepage panel — and a fix here reaches all eighteen forms
 * at once.
 */

export interface UploadItem {
  /** Stable per-attempt id, so React keys survive a retry. */
  id: string;
  name: string;
  size: number;
  percent: number;
  status: "queued" | "uploading" | "done" | "error";
  error?: string;
  /** Present only while uploading — a local object URL for the preview. */
  previewUrl?: string;
  result?: UploadedMedia;
}

export interface UseMediaUploadOptions {
  scope: MediaScope;
  ownerId?: string | null;
  onUploaded: (media: UploadedMedia[]) => void;
}

let counter = 0;
const nextId = () => `u${++counter}-${Date.now()}`;

export function useMediaUpload({ scope, ownerId, onUploaded }: UseMediaUploadOptions) {
  const [items, setItems] = useState<UploadItem[]>([]);
  const controllers = useRef(new Map<string, AbortController>());
  // Kept so a failed item can be retried with the exact same File rather than
  // asking the editor to find it on disk again.
  const files = useRef(new Map<string, File>());

  const patch = useCallback((id: string, next: Partial<UploadItem>) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...next } : i)));
  }, []);

  const runOne = useCallback(
    async (id: string, file: File): Promise<UploadedMedia | null> => {
      const controller = new AbortController();
      controllers.current.set(id, controller);
      patch(id, { status: "uploading", percent: 0, error: undefined });

      try {
        const media = await uploadMedia(file, {
          scope,
          ownerId,
          signal: controller.signal,
          onProgress: (p) => patch(id, { percent: p.percent }),
        });
        patch(id, { status: "done", percent: 100, result: media });
        return media;
      } catch (err) {
        patch(id, {
          status: "error",
          error:
            err instanceof MediaUploadError
              ? err.message
              : err instanceof Error
                ? err.message
                : "The upload failed.",
        });
        return null;
      } finally {
        controllers.current.delete(id);
      }
    },
    [scope, ownerId, patch]
  );

  /** Queue and upload files, reporting only the ones that actually landed. */
  const upload = useCallback(
    async (fileList: FileList | File[]) => {
      const incoming = Array.from(fileList);
      if (incoming.length === 0) return;

      const queued: { id: string; file: File }[] = [];
      const rejected: UploadItem[] = [];

      for (const file of incoming) {
        const id = nextId();
        try {
          // Reject an unusable file here rather than after a round trip, so
          // the message names the file and appears immediately.
          validateFile(file);
          files.current.set(id, file);
          queued.push({ id, file });
        } catch (err) {
          rejected.push({
            id,
            name: file.name,
            size: file.size,
            percent: 0,
            status: "error",
            error: err instanceof Error ? err.message : "This file cannot be uploaded.",
          });
        }
      }

      setItems((prev) => [
        ...prev,
        ...queued.map(({ id, file }) => ({
          id,
          name: file.name,
          size: file.size,
          percent: 0,
          status: "queued" as const,
          previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
        })),
        ...rejected,
      ]);

      // Sequential rather than parallel: a gallery drop of twenty 8MB photos
      // in parallel saturates the uplink and makes every individual progress
      // bar crawl, which reads as a hang.
      const done: UploadedMedia[] = [];
      for (const { id, file } of queued) {
        const media = await runOne(id, file);
        if (media) done.push(media);
      }
      if (done.length > 0) onUploaded(done);
    },
    [runOne, onUploaded]
  );

  const retry = useCallback(
    async (id: string) => {
      const file = files.current.get(id);
      if (!file) return;
      const media = await runOne(id, file);
      if (media) onUploaded([media]);
    },
    [runOne, onUploaded]
  );

  const cancel = useCallback((id: string) => {
    controllers.current.get(id)?.abort();
  }, []);

  /** Drop finished/failed rows from the list once the editor has seen them. */
  const dismiss = useCallback((id: string) => {
    setItems((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((i) => i.id !== id);
    });
    files.current.delete(id);
  }, []);

  const clearFinished = useCallback(() => {
    setItems((prev) => {
      for (const i of prev) {
        if (i.status === "done" && i.previewUrl) URL.revokeObjectURL(i.previewUrl);
      }
      return prev.filter((i) => i.status !== "done");
    });
  }, []);

  const busy = items.some((i) => i.status === "uploading" || i.status === "queued");

  return { items, busy, upload, retry, cancel, dismiss, clearFinished };
}
