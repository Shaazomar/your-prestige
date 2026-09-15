"use client";

import { uploadMedia, MediaUploadError } from "@/lib/media/client";
import type { MediaScope } from "@/lib/media/keys";
import { isMediaScope } from "@/lib/media/keys";

/**
 * Back-compatible wrapper over the central uploader.
 *
 * Kept because a couple of call sites pass a legacy folder string rather than
 * a scope. It no longer contains an upload implementation of its own — in
 * particular it no longer catches a direct-S3 failure and silently retries the
 * whole thing through the app server. That fallback is what turned a CORS
 * rejection into "File is too large for serverless upload", sending people to
 * resize images that were never the problem.
 *
 * New code should call `uploadMedia` from `@/lib/media/client` directly and
 * pass a real scope and owner id, so the object key identifies its owner.
 */
export async function uploadMediaClient(
  file: File,
  folder = "shared"
): Promise<{ url: string; id?: string; key?: string }> {
  const scope: MediaScope = isMediaScope(folder) ? folder : "shared";
  const media = await uploadMedia(file, { scope });
  return { url: media.url, id: media.id, key: media.key };
}

export { MediaUploadError };
