import {
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getS3Client, getS3Config } from "@/lib/s3";
import { buildObjectUrl } from "@/lib/s3-url";
import { buildMediaKey, type MediaScope } from "@/lib/media/keys";

/**
 * The one server-side S3 surface for CMS media.
 *
 * Two things here are load-bearing and were wrong before.
 *
 * 1. **The presigned URL did not sign `content-type`.** `getSignedUrl` only
 *    signs `host` unless it is told otherwise, so passing `ContentType` to
 *    `PutObjectCommand` had no effect on the signature at all — four
 *    different content types produced byte-identical signatures. The
 *    consequence was not a broken upload but a broken *guarantee*: the server
 *    validated the declared type, then issued a URL that would accept any
 *    type at all. A caller holding a URL signed for "image/jpeg" could PUT
 *    `text/html`, and S3 would store and later serve it as HTML from the
 *    media origin — the stored-XSS hole `upload-validation.ts` exists to
 *    close. `signableHeaders` now pins it, so the Content-Type the browser
 *    sends must equal the one the URL was signed for, exactly as the upload
 *    contract requires.
 *
 * 2. **Nothing ever confirmed the object arrived.** The CMS wrote the object
 *    URL into the database on the strength of a 200 from the browser's PUT.
 *    `headUploadedObject` makes that a verified fact before any row is
 *    written, so a record can never point at a key that is not in the bucket.
 */

/** Presigned PUTs are short-lived: the browser uses one within seconds. */
export const PRESIGN_EXPIRY_SECONDS = 15 * 60;

/**
 * Cache header stored with every upload.
 *
 * Safe to make this aggressive because object keys are uuid-based: replacing
 * an image writes a new key and therefore a new URL, so a cached copy can
 * never be stale. It must be *signed and sent* — a presigned PUT only carries
 * the headers the client actually transmits, so setting `CacheControl` on the
 * command without sending it from the browser stored nothing at all.
 */
export const UPLOAD_CACHE_CONTROL = "public, max-age=31536000, immutable";

export interface PresignResult {
  uploadUrl: string;
  objectUrl: string;
  key: string;
  /** The exact value the client MUST send as its Content-Type header. */
  contentType: string;
  /** The exact value the client MUST send as its Cache-Control header. */
  cacheControl: string;
  expiresInSeconds: number;
}

/**
 * Normalise a content type to the single canonical form used for signing,
 * for the PUT header and for the stored object.
 *
 * Signing is byte-exact, so "image/jpeg", "image/jpeg; charset=UTF-8" and
 * "IMAGE/JPEG" must not be allowed to diverge between the two ends. Both ends
 * call this.
 */
export function canonicalContentType(contentType: string): string {
  return (contentType || "").split(";")[0].trim().toLowerCase();
}

/** Public URL for a stored key. Thin re-export of the one canonical builder in `s3-url.ts`. */
export const objectUrlForKey = buildObjectUrl;

export interface PresignInput {
  scope: MediaScope;
  ownerId?: string | null;
  contentType: string;
}

export async function presignUpload({
  scope,
  ownerId,
  contentType,
}: PresignInput): Promise<PresignResult> {
  const { bucket } = getS3Config();
  const type = canonicalContentType(contentType);
  const key = buildMediaKey({ scope, ownerId, contentType: type });

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: type,
    CacheControl: UPLOAD_CACHE_CONTROL,
  });

  const uploadUrl = await getSignedUrl(getS3Client(), command, {
    expiresIn: PRESIGN_EXPIRY_SECONDS,
    // Without this the signature covers `host` alone — see the note above.
    // Both headers are pinned, so the object's stored type and cache policy
    // are the ones this server chose, not the ones the caller felt like.
    signableHeaders: new Set(["content-type", "cache-control"]),
  });

  return {
    uploadUrl,
    objectUrl: objectUrlForKey(key),
    key,
    contentType: type,
    cacheControl: UPLOAD_CACHE_CONTROL,
    expiresInSeconds: PRESIGN_EXPIRY_SECONDS,
  };
}

export interface HeadResult {
  exists: boolean;
  size?: number;
  contentType?: string;
}

/**
 * Confirm an object is really in the bucket, and how big it is.
 *
 * Called after the browser reports a successful PUT and before anything is
 * written to the database, so "the CMS says the image is saved" and "the
 * image is in S3" cannot drift apart.
 */
export async function headUploadedObject(key: string): Promise<HeadResult> {
  const { bucket } = getS3Config();
  try {
    const res = await getS3Client().send(
      new HeadObjectCommand({ Bucket: bucket, Key: key })
    );
    return {
      exists: true,
      size: typeof res.ContentLength === "number" ? res.ContentLength : undefined,
      contentType: res.ContentType ?? undefined,
    };
  } catch (err) {
    // A genuine 404/403 means "not there". Anything else is an infrastructure
    // failure and must not be reported as a missing object — that would let a
    // transient error look like a failed upload and trigger a pointless retry.
    const name = (err as { name?: string } | null)?.name;
    const status = (err as { $metadata?: { httpStatusCode?: number } } | null)?.$metadata
      ?.httpStatusCode;
    if (name === "NotFound" || name === "NoSuchKey" || status === 404 || status === 403) {
      return { exists: false };
    }
    throw err;
  }
}

/**
 * Delete one object.
 *
 * Deliberately never called before the database row that replaced it has been
 * written — see `replaceMedia` in `media-service.ts`. Losing the new pointer
 * *and* the old file is the one unrecoverable outcome here.
 */
export async function deleteObject(key: string): Promise<void> {
  if (!key) return;
  const { bucket } = getS3Config();
  await getS3Client().send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}
