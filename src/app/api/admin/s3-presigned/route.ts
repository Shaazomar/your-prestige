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
      // Previously this answered 200 with `{ directUpload: false }`, which the
      // client read as "fall back quietly". Unconfigured storage is a
      // deployment fault, not a routine branch, and saying so is what lets an
      // admin fix it instead of filing a bug about images.
      return NextResponse.json(
        {
          error:
            "Media storage is not configured. Set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET and S3_REGION, then redeploy. See docs/aws-s3-setup.md.",
        },
        { status: 503 }
      );
    }

    const type = (contentType || "").split(";")[0].trim().toLowerCase();
    assertAllowedUpload(filename, type);

    const { uploadUrl, objectUrl, key } = await getPresignedUploadUrl(filename, type, folder);

    return NextResponse.json({
      directUpload: true,
      uploadUrl,
      objectUrl,
      key,
      // Echoed so the client sends exactly the value that was signed.
      contentType: type,
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
