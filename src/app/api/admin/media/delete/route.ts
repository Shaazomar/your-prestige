import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { deleteOwnedMedia, MediaError } from "@/lib/media/media-service";
import { isMediaScope } from "@/lib/media/keys";

/**
 * Delete one media object, subject to the ownership and shared-use checks in
 * `deleteOwnedMedia`.
 *
 * Note this is only reachable for an object whose key is inside the editing
 * record's own prefix, and it refuses when the same asset is still attached
 * somewhere else — removing an image from a product must not pull it out from
 * under the homepage panel that also uses it.
 */
export async function POST(req: NextRequest) {
  try {
    await requirePermission("media", "delete");

    const body = (await req.json().catch(() => null)) as {
      key?: string;
      scope?: string;
      ownerId?: string;
    } | null;

    if (!body?.key || !body?.ownerId || !isMediaScope(body.scope)) {
      return NextResponse.json(
        { error: "key, scope and ownerId are required." },
        { status: 400 }
      );
    }

    const result = await deleteOwnedMedia({
      key: body.key,
      scope: body.scope,
      ownerId: body.ownerId,
    });

    return NextResponse.json(
      result.deleted
        ? { deleted: true }
        : {
            deleted: false,
            reason: result.reason,
            message:
              "The file stays in storage because another record still uses it. It has been removed from this one.",
          }
    );
  } catch (err) {
    if (err instanceof MediaError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "Could not delete the file.";
    if (message === "UNAUTHENTICATED") {
      return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
    }
    if (message === "FORBIDDEN") {
      return NextResponse.json({ error: "Permission denied." }, { status: 403 });
    }
    console.error("media delete failed:", err);
    return NextResponse.json({ error: `Could not delete the file: ${message}` }, { status: 500 });
  }
}
