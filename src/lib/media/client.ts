"use client";

import type { MediaScope } from "@/lib/media/keys";

/**
 * The one client-side uploader the CMS uses.
 *
 * Flow: ask the server to presign → PUT the bytes straight to S3 → tell the
 * server to verify and record it. The bytes never pass through the app
 * server, so a 40MB brand video is not subject to the serverless body limit,
 * and no AWS credential ever reaches the browser — the presigned URL is a
 * one-object, 15-minute capability and nothing more.
 *
 * Two behaviours are deliberate reactions to how this failed before.
 *
 * **Errors are not swallowed.** The old uploader wrapped the entire direct-S3
 * attempt in a try/catch that logged a console warning and silently fell back
 * to a server-side upload. A CORS rejection, an expired signature and a
 * permissions error all came out the far end as one generic "Upload failed"
 * — or, on a large file, as a misleading complaint about the serverless size
 * limit. The real cause was never visible to the person who could fix it.
 * Each failure mode now reports itself.
 *
 * **Progress is real.** `fetch` cannot report upload progress, so the PUT uses
 * XMLHttpRequest, whose `upload.onprogress` reflects bytes actually on the
 * wire.
 */

export interface UploadProgress {
  loaded: number;
  total: number;
  /** 0–100, clamped. */
  percent: number;
}

export interface UploadedMedia {
  id: string;
  url: string;
  key: string;
  size: number;
}

export interface UploadOptions {
  scope: MediaScope;
  /** The owning record's id, when it already exists. */
  ownerId?: string | null;
  onProgress?: (p: UploadProgress) => void;
  signal?: AbortSignal;
  /** Network-level retries for the S3 PUT. Default 2 (three attempts total). */
  retries?: number;
}

/** An upload failure that knows what actually went wrong. */
export class MediaUploadError extends Error {
  readonly stage: "validate" | "presign" | "transfer" | "confirm";
  /** True when trying the same file again could plausibly succeed. */
  readonly retryable: boolean;

  constructor(
    message: string,
    stage: MediaUploadError["stage"],
    retryable = false
  ) {
    super(message);
    this.name = "MediaUploadError";
    this.stage = stage;
    this.retryable = retryable;
  }
}

/** Mirrors the server's allowed list so a bad file is rejected before any request. */
const ALLOWED = new Set([
  "image/jpeg", "image/png", "image/webp", "image/avif", "image/gif",
  "video/mp4", "video/webm", "video/quicktime",
  "application/pdf",
]);

const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

const EXT_FALLBACK: Record<string, string> = {
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp",
  avif: "image/avif", gif: "image/gif", mp4: "video/mp4", webm: "video/webm",
  mov: "video/quicktime", pdf: "application/pdf",
};

/**
 * The browser's own `file.type`, or the extension when it gives us nothing.
 *
 * `file.type` is empty surprisingly often — `.mov` and `.avif` on several
 * platforms, and anything arriving from a source the OS has no mapping for.
 * The old code substituted "application/octet-stream", which the server then
 * rejected as a disallowed type: a valid photo failing validation because the
 * operating system was vague about it.
 */
function resolveContentType(file: File): string {
  const declared = (file.type || "").split(";")[0].trim().toLowerCase();
  if (declared && ALLOWED.has(declared)) return declared;
  const ext = file.name.toLowerCase().split(".").pop() ?? "";
  return EXT_FALLBACK[ext] ?? declared ?? "";
}

function humanSize(bytes: number): string {
  return bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)}MB`
    : `${Math.max(1, Math.round(bytes / 1024))}KB`;
}

/** Fail fast, in the browser, with a message that says what to do. */
export function validateFile(file: File): { contentType: string } {
  const contentType = resolveContentType(file);

  if (!contentType || !ALLOWED.has(contentType)) {
    throw new MediaUploadError(
      `"${file.name}" is a ${contentType || "file of unknown"} type, which isn't accepted. Use JPG, PNG, WebP, AVIF or GIF for images, MP4, WebM or MOV for video, or PDF.`,
      "validate"
    );
  }

  const isImage = contentType.startsWith("image/");
  const limit = isImage ? MAX_IMAGE_BYTES : MAX_UPLOAD_BYTES;
  if (file.size > limit) {
    throw new MediaUploadError(
      `"${file.name}" is ${humanSize(file.size)} — the limit for ${isImage ? "images" : "this file type"} is ${humanSize(limit)}. Please resize or compress it and try again.`,
      "validate"
    );
  }

  if (file.size === 0) {
    throw new MediaUploadError(`"${file.name}" is empty (0 bytes).`, "validate");
  }

  return { contentType };
}

/**
 * PUT the file to the presigned URL, reporting progress.
 *
 * The `Content-Type` sent here must be byte-identical to the one the URL was
 * signed for, which is why the server echoes it back in the presign response
 * and this sends that value rather than re-deriving it.
 */
function putToS3(
  uploadUrl: string,
  file: File,
  headers: { contentType: string; cacheControl: string },
  opts: { onProgress?: (p: UploadProgress) => void; signal?: AbortSignal }
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl, true);
    // Both are part of the signature, so both must be sent verbatim. The
    // bucket's CORS AllowedHeaders must list them or the browser will not
    // even send the request.
    xhr.setRequestHeader("Content-Type", headers.contentType);
    xhr.setRequestHeader("Cache-Control", headers.cacheControl);

    xhr.upload.onprogress = (e) => {
      if (!e.lengthComputable || !opts.onProgress) return;
      opts.onProgress({
        loaded: e.loaded,
        total: e.total,
        percent: Math.min(100, Math.round((e.loaded / e.total) * 100)),
      });
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) return resolve();

      // S3 answers with an XML error document; its <Code> is the single most
      // useful thing to show, and it is what distinguishes "your clock is
      // wrong" from "your bucket policy is wrong".
      const code = /<Code>([^<]+)<\/Code>/.exec(xhr.responseText || "")?.[1];
      reject(
        new MediaUploadError(
          describeS3Error(xhr.status, code),
          "transfer",
          xhr.status >= 500
        )
      );
    };

    // The browser reports a CORS rejection as an opaque network error: status
    // 0, no body. It is by far the most common reason a correctly configured
    // bucket still refuses uploads, so it gets named rather than guessed at.
    xhr.onerror = () =>
      reject(
        new MediaUploadError(
          "The browser could not reach the storage bucket. This is almost always the bucket's CORS rules: they must allow PUT from this site's origin and permit the Content-Type header. See docs/aws-s3-setup.md.",
          "transfer",
          false
        )
      );

    xhr.ontimeout = () =>
      reject(new MediaUploadError("The upload timed out.", "transfer", true));

    xhr.onabort = () =>
      reject(new MediaUploadError("Upload cancelled.", "transfer", false));

    if (opts.signal) {
      if (opts.signal.aborted) return xhr.abort();
      opts.signal.addEventListener("abort", () => xhr.abort(), { once: true });
    }

    xhr.send(file);
  });
}

function describeS3Error(status: number, code?: string): string {
  switch (code) {
    case "AccessDenied":
      return "Storage rejected the upload (AccessDenied). The IAM user needs s3:PutObject on this bucket — see docs/aws-s3-setup.md.";
    case "SignatureDoesNotMatch":
      return "Storage rejected the upload signature. The Content-Type sent did not match the one the upload URL was signed for.";
    case "ExpiredToken":
    case "RequestTimeTooSkewed":
      return "The upload link had expired by the time the transfer finished. Please try again.";
    case "EntityTooLarge":
      return "The file is larger than the bucket accepts.";
    case "NoSuchBucket":
      return "The configured S3 bucket does not exist. Check S3_BUCKET and S3_REGION.";
    default:
      return code
        ? `Storage rejected the upload (${code}, HTTP ${status}).`
        : `Storage rejected the upload with HTTP ${status}.`;
  }
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(
      (data as { error?: string }).error || `Request failed (HTTP ${res.status}).`
    );
    (err as Error & { status?: number }).status = res.status;
    throw err;
  }
  return data as T;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Upload one file: presign → PUT → confirm. Throws `MediaUploadError`. */
export async function uploadMedia(file: File, opts: UploadOptions): Promise<UploadedMedia> {
  const { contentType } = validateFile(file);

  let presigned: {
    uploadUrl: string;
    objectUrl: string;
    key: string;
    contentType: string;
    cacheControl: string;
  };
  try {
    presigned = await postJson("/api/admin/media/presign", {
      filename: file.name,
      contentType,
      size: file.size,
      scope: opts.scope,
      ownerId: opts.ownerId ?? null,
    });
  } catch (err) {
    const status = (err as Error & { status?: number }).status;
    const message = err instanceof Error ? err.message : "Could not start the upload.";
    throw new MediaUploadError(
      status === 401
        ? "Your session has expired. Sign in again to upload."
        : status === 403
          ? "You do not have permission to upload media."
          : message,
      "presign",
      status === undefined || status >= 500
    );
  }

  const attempts = Math.max(0, opts.retries ?? 2) + 1;
  let lastError: MediaUploadError | null = null;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      await putToS3(
        presigned.uploadUrl,
        file,
        { contentType: presigned.contentType, cacheControl: presigned.cacheControl },
        { onProgress: opts.onProgress, signal: opts.signal }
      );
      lastError = null;
      break;
    } catch (err) {
      lastError = err instanceof MediaUploadError
        ? err
        : new MediaUploadError("The upload failed.", "transfer", true);
      // Only a transient failure is worth repeating; a CORS or permissions
      // rejection will fail identically every time and retrying it just makes
      // the person wait longer for the same message.
      if (!lastError.retryable || attempt === attempts) break;
      await sleep(400 * attempt);
    }
  }
  if (lastError) throw lastError;

  try {
    const confirmed = await postJson<UploadedMedia>("/api/admin/media/complete", {
      key: presigned.key,
      scope: opts.scope,
      ownerId: opts.ownerId ?? null,
      filename: file.name,
      contentType: presigned.contentType,
    });
    return confirmed;
  } catch (err) {
    throw new MediaUploadError(
      err instanceof Error ? err.message : "The upload could not be confirmed.",
      "confirm",
      true
    );
  }
}

/** Remove an uploaded object. Only ever called after the record has saved. */
export async function deleteMedia(opts: {
  key: string;
  scope: MediaScope;
  ownerId: string;
}): Promise<{ deleted: boolean; reason?: string }> {
  return postJson("/api/admin/media/delete", opts);
}
