import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { completeUpload, MediaError } from "@/lib/media/media-service";
import { isMediaScope } from "@/lib/media/keys";

/**
 * Confirm an object landed in S3 and record it as a `Media` row.
 *
 * This is the step that makes "CMS → S3 → database" true rather than
 * aspirational: until it succeeds the upload is not reported to the editor as
 * saved, so a URL can never be written into a product or brand without the
 * object behind it being verified present.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("media", "create");

    const body = (await req.json().catch(() => null)) as {
      key?: string;
      scope?: string;
      ownerId?: string | null;
      filename?: string;
      contentType?: string;
    } | null;

    if (!body?.key || !body?.filename || !body?.contentType) {
      return NextResponse.json(
        { error: "key, filename and contentType are required." },
        { status: 400 }
      );
    }
    if (!isMediaScope(body.scope)) {
      return NextResponse.json({ error: "Unknown media scope." }, { status: 400 });
    }
    // The key must be one this server could have issued for this scope.
    if (!body.key.startsWith(`${body.scope}/`) || body.key.includes("..")) {
      return NextResponse.json({ error: "That object key is not valid." }, { status: 400 });
    }

    const media = await completeUpload({
      key: body.key,
      scope: body.scope,
      ownerId: body.ownerId ?? null,
      filename: body.filename,
      contentType: body.contentType,
      uploadedById: session.user.id,
    });

    return NextResponse.json(media, { status: 201 });
  } catch (err) {
    if (err instanceof MediaError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "Could not confirm the upload.";
    if (message === "UNAUTHENTICATED") {
      return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
    }
    if (message === "FORBIDDEN") {
      return NextResponse.json({ error: "Permission denied." }, { status: 403 });
    }
    console.error("media complete failed:", err);
    return NextResponse.json(
      { error: `Could not confirm the upload: ${message}` },
      { status: 500 }
    );
  }
}
