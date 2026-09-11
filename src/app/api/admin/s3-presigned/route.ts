import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { getPresignedUploadUrl, isS3Configured } from "@/lib/s3";
import { assertAllowedUpload, UploadValidationError } from "@/lib/upload-validation";

export async function POST(req: NextRequest) {
  try {
    await requirePermission("media", "create");

    const body = await req.json();
    const { filename, contentType, folder = "uploads" } = body;

    if (!filename || !contentType) {
      return NextResponse.json({ error: "Filename and contentType are required" }, { status: 400 });
    }

    if (!isS3Configured()) {
      return NextResponse.json({ directUpload: false });
    }

    assertAllowedUpload(filename, contentType);

    const { uploadUrl, objectUrl, key } = await getPresignedUploadUrl(filename, contentType, folder);

    return NextResponse.json({
      directUpload: true,
      uploadUrl,
      objectUrl,
      key,
    });
  } catch (err) {
    if (err instanceof UploadValidationError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "Presigned URL generation failed";
    const status = message === "UNAUTHENTICATED" ? 401 : message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
