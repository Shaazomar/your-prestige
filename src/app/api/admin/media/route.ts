import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { uploadFile } from "@/lib/storage";

const MAX_SIZE = 15 * 1024 * 1024; // 15MB

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("media", "create");

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File exceeds 15MB limit" }, { status: 413 });
    }

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
    const message = err instanceof Error ? err.message : "Upload failed";
    const status = message === "UNAUTHENTICATED" ? 401 : message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
