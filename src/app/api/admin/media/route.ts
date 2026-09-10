import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { uploadFile } from "@/lib/storage";
import { assertAllowedUpload, MAX_UPLOAD_BYTES, UploadValidationError } from "@/lib/upload-validation";

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("media", "create");

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    assertAllowedUpload(file.name, file.type, file.size, { maxBytes: MAX_UPLOAD_BYTES });

    const result = await uploadFile(file);

    const media = await prisma.media.create({
      data: {
        url: result.url,
        publicId: result.publicId,
        filename: file.name,
        mimeType: file.type || "application/octet-stream",
        size: file.size,
        width: result.width,
        height: result.height,
        uploadedById: session.user.id,
      },
    });

    await logAudit({ action: "media.upload", entity: "Media", entityId: media.id, newValue: media });

    return NextResponse.json({ id: media.id, url: media.url }, { status: 201 });
  } catch (err) {
    if (err instanceof UploadValidationError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "Upload failed";
    const status = message === "UNAUTHENTICATED" ? 401 : message === "FORBIDDEN" ? 403 : 500;
    if (status === 500) console.error("media upload failed:", err);
    return NextResponse.json(
      { error: status === 500 ? "Upload failed. Check the server log." : message },
      { status }
    );
  }
}
