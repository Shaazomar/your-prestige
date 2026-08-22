import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { getPresignedUploadUrl } from "@/lib/s3";

export async function POST(req: NextRequest) {
  try {
    await requirePermission("media", "create");

    const body = await req.json();
    const { filename, contentType, folder = "uploads" } = body;

    if (!filename || !contentType) {
      return NextResponse.json({ error: "Filename and contentType are required" }, { status: 400 });
    }

    const s3Configured = !!(
      process.env.AWS_ACCESS_KEY_ID?.trim() &&
      process.env.AWS_SECRET_ACCESS_KEY?.trim() &&
      !process.env.AWS_ACCESS_KEY_ID.includes("your_")
    );

    if (!s3Configured) {
      return NextResponse.json({ directUpload: false });
    }

    const { uploadUrl, objectUrl, key } = await getPresignedUploadUrl(filename, contentType, folder);

    return NextResponse.json({
      directUpload: true,
      uploadUrl,
      objectUrl,
      key,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Presigned URL generation failed";
    const status = message === "UNAUTHENTICATED" ? 401 : message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
