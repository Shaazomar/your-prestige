import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { uploadFileToS3 } from "@/lib/s3";

const MAX_SIZE = 15 * 1024 * 1024; // 15MB

export async function POST(req: NextRequest) {
  try {
    await requirePermission("aboutPeople", "create");

    const form = await req.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File size exceeds 15MB limit" }, { status: 413 });
    }

    const { url, key } = await uploadFileToS3(file, "about");

    return NextResponse.json({ url, key }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "S3 Upload failed";
    const status = message === "UNAUTHENTICATED" ? 401 : message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
