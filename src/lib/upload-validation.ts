/**
 * Shared upload constraints for every admin upload path.
 *
 * All three routes (/api/admin/media, /api/admin/s3-upload and the presigned
 * /api/admin/s3-presigned) previously accepted whatever content type and
 * extension the browser named. The presigned route in particular signed a PUT
 * for that exact Content-Type, so an admin-session request could have parked
 * an .html or .svg file with `text/html` on the media bucket that the site
 * serves from — stored XSS on the bucket's own origin, plus no size ceiling
 * at all on that path.
 */

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
] as const;

export const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"] as const;

export const ALLOWED_DOC_TYPES = ["application/pdf"] as const;

export const ALLOWED_UPLOAD_TYPES: readonly string[] = [
  ...ALLOWED_IMAGE_TYPES,
  ...ALLOWED_VIDEO_TYPES,
  ...ALLOWED_DOC_TYPES,
];

/**
 * Extension must agree with the declared type. SVG is deliberately absent:
 * it is an executable document in a browser, and nothing in the CMS needs it.
 */
const EXTENSIONS_BY_TYPE: Record<string, readonly string[]> = {
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "image/webp": ["webp"],
  "image/avif": ["avif"],
  "image/gif": ["gif"],
  "video/mp4": ["mp4"],
  "video/webm": ["webm"],
  "video/quicktime": ["mov"],
  "application/pdf": ["pdf"],
};

export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024; // 50MB
export const MAX_IMAGE_BYTES = 15 * 1024 * 1024; // 15MB

export class UploadValidationError extends Error {
  readonly status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "UploadValidationError";
    this.status = status;
  }
}

function extensionOf(filename: string): string {
  const parts = filename.toLowerCase().split(".");
  return parts.length > 1 ? parts[parts.length - 1] : "";
}

export function assertAllowedUpload(
  filename: string,
  contentType: string,
  size?: number,
  opts?: { maxBytes?: number; allowedTypes?: readonly string[] }
) {
  const allowed = opts?.allowedTypes ?? ALLOWED_UPLOAD_TYPES;
  const maxBytes = opts?.maxBytes ?? MAX_UPLOAD_BYTES;

  if (!filename?.trim()) throw new UploadValidationError("A filename is required.");

  // A traversal-shaped name never reaches the object key (keys are rebuilt
  // from a sanitised basename), but reject it outright rather than rely on that.
  if (filename.includes("/") || filename.includes("\\") || filename.includes("..")) {
    throw new UploadValidationError("Filename must not contain path segments.");
  }

  const type = (contentType || "").split(";")[0].trim().toLowerCase();
  if (!allowed.includes(type)) {
    throw new UploadValidationError(
      `Files of type "${contentType || "unknown"}" are not accepted. Allowed: ${allowed.join(", ")}.`,
      415
    );
  }

  const ext = extensionOf(filename);
  const expected = EXTENSIONS_BY_TYPE[type] ?? [];
  if (!expected.includes(ext)) {
    throw new UploadValidationError(
      `File extension ".${ext || "?"}" does not match the declared type "${type}".`
    );
  }

  if (typeof size === "number" && size > maxBytes) {
    throw new UploadValidationError(
      `File is ${(size / 1024 / 1024).toFixed(1)}MB — the limit is ${Math.round(maxBytes / 1024 / 1024)}MB.`,
      413
    );
  }

  return { type, ext };
}
