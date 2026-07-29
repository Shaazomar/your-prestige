import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { uploadFile, canUploadMedia } from "@/lib/storage";
import { logAudit } from "@/lib/audit";

/**
 * Catalogue PDF upload.
 *
 * Separate from /api/admin/media because the constraints differ: brand
 * catalogues routinely run past the 15 MB the media library allows, they must
 * be PDFs, and they belong in the catalog folder tree rather than the general
 * media pool. No `Media` row is created — the file is an import source, not a
 * library asset.
 */

const MAX_SIZE = 120 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("catalogImports", "create");

    const storage = canUploadMedia();
    if (!storage.ok) {
      return NextResponse.json({ error: storage.reason }, { status: 400 });
    }

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file was received." }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: `That catalogue is ${(file.size / 1024 / 1024).toFixed(0)} MB — the limit is ${MAX_SIZE / 1024 / 1024} MB.` },
        { status: 413 }
      );
    }
    const isPdf =
      file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      return NextResponse.json({ error: "Only PDF catalogues can be imported." }, { status: 415 });
    }

    const result = await uploadFile(file, { folder: "catalog/sources" });

    await logAudit({
      action: "catalog_import.upload",
      entity: "CatalogImport",
      newValue: { filename: file.name, size: file.size, url: result.url },
    });

    return NextResponse.json(
      {
        url: result.url,
        publicId: result.publicId ?? null,
        filename: file.name,
        size: file.size,
        uploadedBy: session.user.id,
      },
      { status: 201 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    const status = message === "UNAUTHENTICATED" ? 401 : message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
