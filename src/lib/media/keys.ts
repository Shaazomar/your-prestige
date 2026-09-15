import { randomUUID } from "crypto";

/**
 * S3 object keys for CMS media.
 *
 * Keys are owner-scoped and collision-proof by construction:
 *
 *     products/{productId}/{uuid}.jpg
 *     brands/{brandId}/{uuid}.webp
 *     categories/{categoryId}/{uuid}.png
 *     collections/{collectionId}/{uuid}.mp4
 *
 * The previous scheme was `{folder}/{Date.now()}-{filename}`, which had three
 * problems. Two uploads inside the same millisecond collided; the object gave
 * no clue which record owned it, so nothing could be cleaned up safely; and
 * the original filename rode into the key, which leaks whatever the marketing
 * folder happened to be called and drags spaces and unicode into a URL.
 *
 * A uuid basename also means replacing an image never reuses a key, so a CDN
 * or browser cache can never serve the old bytes under the new URL.
 */

/** Scopes that own media. `shared` is for library uploads with no one owner. */
export type MediaScope =
  | "products"
  | "brands"
  | "categories"
  | "collections"
  | "homepage"
  | "navigation"
  | "showrooms"
  | "gallery"
  | "blog"
  | "offers"
  | "about"
  | "shared";

const SCOPES: readonly MediaScope[] = [
  "products", "brands", "categories", "collections", "homepage", "navigation",
  "showrooms", "gallery", "blog", "offers", "about", "shared",
];

export function isMediaScope(v: unknown): v is MediaScope {
  return typeof v === "string" && (SCOPES as readonly string[]).includes(v);
}

/** One path segment, safe for an S3 key and for a URL without escaping. */
function safeId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64);
}

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
  "application/pdf": "pdf",
};

/**
 * The extension is derived from the *validated content type*, never from the
 * filename the browser supplied. `assertAllowedUpload` has already proven the
 * two agree, and deriving it here means the key can't be steered by a name
 * like "photo.jpg.html".
 */
export function extensionForType(contentType: string): string {
  return EXT_BY_TYPE[contentType.split(";")[0].trim().toLowerCase()] ?? "bin";
}

export interface BuildKeyInput {
  scope: MediaScope;
  /** The owning record's id. Omitted for scopes that have no per-record owner. */
  ownerId?: string | null;
  contentType: string;
}

/**
 * Build the object key. Never contains the uploader's filename, so it cannot
 * carry a path segment, an unexpected extension, or a second dot-extension.
 */
export function buildMediaKey({ scope, ownerId, contentType }: BuildKeyInput): string {
  const ext = extensionForType(contentType);
  const id = ownerId ? safeId(ownerId) : "";
  // An owner-less upload (a brand-new record that has no id yet, or a library
  // upload) goes to the scope's `_unassigned` bucket rather than the scope
  // root, so it is obvious later which objects were never attached.
  const ownerSegment = id || "_unassigned";
  return `${scope}/${ownerSegment}/${randomUUID()}.${ext}`;
}

/**
 * Is `key` inside the subtree owned by this record?
 *
 * Deletes are gated on this: an object under `products/abc/` may be removed
 * while editing product `abc` and never while editing anything else, so one
 * record can't delete media another record is still pointing at.
 */
export function keyBelongsTo(key: string, scope: MediaScope, ownerId: string): boolean {
  if (!key || !ownerId) return false;
  return key.startsWith(`${scope}/${safeId(ownerId)}/`);
}
