import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { getPresignedUploadUrl, isS3Configured } from "@/lib/s3";
import { assertAllowedUpload, MAX_UPLOAD_BYTES, UploadValidationError } from "@/lib/upload-validation";

export async function POST(req: NextRequest) {
  try {
    await requirePermission("media", "create");

    const body = await req.json();
    const { filename, contentType, size, folder = "uploads" } = body;

    if (typeof filename !== "string" || typeof contentType !== "string" || !filename || !contentType) {
      return NextResponse.json({ error: "Filename and contentType are required" }, { status: 400 });
    }

    // The signature commits the bucket to this exact Content-Type, so it has
    // to be checked before the URL is handed out — not after the upload.
    assertAllowedUpload(filename, contentType, typeof size === "number" ? size : undefined, {
      maxBytes: MAX_UPLOAD_BYTES,
    });

    // Folder is part of the object key; keep it to a known-safe shape.
    if (typeof folder !== "string" || !/^[a-z0-9][a-z0-9/_-]{0,50}$/.test(folder)) {
      return NextResponse.json({ error: "Invalid upload folder" }, { status: 400 });
    }

    if (!isS3Configured()) {
      return NextResponse.json({ directUpload: false });
    }

    const { uploadUrl, objectUrl, key, contentType: resolvedContentType } = await getPresignedUploadUrl(
      filename,
      contentType,
      folder
    );

    return NextResponse.json({
      directUpload: true,
      uploadUrl,
      objectUrl,
      key,
      contentType: resolvedContentType,
    });
  } catch (err) {
    if (err instanceof UploadValidationError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "Presigned URL generation failed";
    const status = message === "UNAUTHENTICATED" ? 401 : message === "FORBIDDEN" ? 403 : 500;
    if (status === 500) console.error("s3-presigned failed:", err);
    return NextResponse.json(
      { error: status === 500 ? "Could not prepare the upload. Check the server log." : message },
      { status }
    );
  }
}
