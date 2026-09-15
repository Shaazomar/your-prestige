import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { isS3Configured } from "@/lib/s3";
import { presignUpload, canonicalContentType } from "@/lib/media/s3-service";
import { isMediaScope } from "@/lib/media/keys";
import { assertAllowedUpload, MAX_UPLOAD_BYTES, MAX_IMAGE_BYTES, UploadValidationError } from "@/lib/upload-validation";

/**
 * Issue a short-lived, single-object upload capability.
 *
 * What the browser receives is a URL that permits exactly one PUT, of one
 * content type, to one key this route chose, for fifteen minutes. It carries
 * no AWS identity: the signature is derived from the server's credentials but
 * cannot be replayed against any other object or verb.
 *
 * The key is built server-side from the scope and owner id, never from
 * anything the client supplies as a path, so a caller cannot aim an upload at
 * another record's prefix.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("media", "create");

    const body = (await req.json().catch(() => null)) as {
      filename?: string;
      contentType?: string;
      size?: number;
      scope?: string;
      ownerId?: string | null;
    } | null;

    if (!body?.filename || !body?.contentType) {
      return NextResponse.json(
        { error: "A filename and contentType are required." },
        { status: 400 }
      );
    }

    if (!isMediaScope(body.scope)) {
      return NextResponse.json(
        { error: `Unknown media scope "${body.scope ?? ""}".` },
        { status: 400 }
      );
    }

    // Normalise first, then validate and sign the *same* string, so the value
    // the client is told to send is the value the signature covers.
    const contentType = canonicalContentType(body.contentType);
    const isImage = contentType.startsWith("image/");
    assertAllowedUpload(body.filename, contentType, body.size, {
      maxBytes: isImage ? MAX_IMAGE_BYTES : MAX_UPLOAD_BYTES,
    });

    if (!isS3Configured()) {
      return NextResponse.json(
        {
          error:
            "Media storage is not configured. Set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET and S3_REGION, then redeploy. See docs/aws-s3-setup.md.",
        },
        { status: 503 }
      );
    }

    const result = await presignUpload({
      scope: body.scope,
      ownerId: body.ownerId ?? null,
      contentType,
    });

    void session;
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof UploadValidationError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "Could not prepare the upload.";
    if (message === "UNAUTHENTICATED") {
      return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
    }
    if (message === "FORBIDDEN") {
      return NextResponse.json(
        { error: "You do not have permission to upload media." },
        { status: 403 }
      );
    }
    console.error("media presign failed:", err);
    // The message is surfaced rather than hidden: an admin seeing
    // "Could not load credentials" or "Inaccessible host" can act on it,
    // where "Something went wrong" sends them to a developer.
    return NextResponse.json(
      { error: `Could not prepare the upload: ${message}` },
      { status: 500 }
    );
  }
}
