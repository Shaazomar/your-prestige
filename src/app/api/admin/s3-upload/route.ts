import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { uploadFileToS3 } from "@/lib/s3";
import {
  assertAllowedUpload,
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  UploadValidationError,
} from "@/lib/upload-validation";

export async function POST(req: NextRequest) {
  try {
    await requirePermission("aboutPeople", "create");

    const form = await req.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // This endpoint only ever backs the About-people portrait field.
    assertAllowedUpload(file.name, file.type, file.size, {
      allowedTypes: ALLOWED_IMAGE_TYPES,
      maxBytes: MAX_IMAGE_BYTES,
    });

    const { url, key } = await uploadFileToS3(file, "about");

    return NextResponse.json({ url, key }, { status: 201 });
  } catch (err) {
    if (err instanceof UploadValidationError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "S3 Upload failed";
    const status = message === "UNAUTHENTICATED" ? 401 : message === "FORBIDDEN" ? 403 : 500;
    if (status === 500) console.error("s3-upload failed:", err);
    return NextResponse.json(
      { error: status === 500 ? "Upload failed. Check the server log." : message },
      { status }
    );
  }
}
