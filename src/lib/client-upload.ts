/**
 * Universal client-side media uploader.
 *
 * Checks for direct AWS S3 presigned URL authorization first.
 * If S3 is configured, uploads directly from browser -> S3 (bypassing Vercel's 4.5MB payload limit).
 * Otherwise falls back to server-side endpoint /api/admin/media.
 */
/** A file the server refused (wrong type, too large) — never retried. */
export class UploadRejectedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UploadRejectedError";
  }
}

export async function uploadMediaClient(
  file: File,
  folder = "uploads"
): Promise<{ url: string; id?: string; key?: string }> {
  try {
    // Step 1: Request presigned S3 upload URL
    const presignedRes = await fetch("/api/admin/s3-presigned", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type || "application/octet-stream",
        size: file.size,
        folder,
      }),
    });

    if (!presignedRes.ok && (presignedRes.status === 400 || presignedRes.status === 413 || presignedRes.status === 415)) {
      // A rejected file type or an oversize file is a real answer, not a
      // reason to retry the other upload path with the same file.
      const data = await presignedRes.json().catch(() => ({}));
      throw new UploadRejectedError(data.error || "This file was rejected.");
    }

    if (presignedRes.ok) {
      const s3Data = await presignedRes.json();
      if (s3Data.directUpload && s3Data.uploadUrl) {
        // Step 2: Direct browser PUT to S3 bucket
        const putRes = await fetch(s3Data.uploadUrl, {
          method: "PUT",
          headers: {
            "Content-Type": file.type || "application/octet-stream",
          },
          body: file,
        });

        if (!putRes.ok) {
          throw new Error(`Direct S3 upload failed with status ${putRes.status}`);
        }

        return { url: s3Data.objectUrl, key: s3Data.key };
      }
    }
  } catch (err) {
    if (err instanceof UploadRejectedError) throw err;
    console.warn("Direct S3 upload check failed, using API endpoint fallback:", err);
  }

  // Fallback to /api/admin/media endpoint
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/admin/media", { method: "POST", body: form });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    if (res.status === 413) {
      throw new Error(
        "File is too large for serverless upload (Vercel 4.5MB limit). Configure AWS S3 credentials in environment variables to enable direct unlimited S3 uploads."
      );
    }
    throw new Error(data.error || "Upload failed");
  }

  return res.json();
}
