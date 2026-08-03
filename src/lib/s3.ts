/**
 * Amazon S3 media pipeline.
 *
 * Bucket layout is fixed — see `MEDIA_PREFIXES`. The database stores object
 * *keys*, never absolute URLs, so the bucket, region or a future CDN can
 * change without a data migration. Call `s3Url()` at render time to resolve
 * a key to a URL.
 *
 * The bucket is public-read for `s3:GetObject` only (no ListBucket, no
 * writes), so rendering needs no signing. Uploads are authenticated: either a
 * presigned PUT the browser uses directly, or a server-side put for the
 * fallback path.
 */

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/** The folder tree every uploaded asset must fall into. */
export const MEDIA_PREFIXES = [
  "gallery",
  "projects",
  "products",
  "collections",
  "brands",
  "homepage",
  "documents",
  "videos",
] as const;

export type MediaPrefix = (typeof MEDIA_PREFIXES)[number];

const BUCKET = process.env.S3_BUCKET ?? "";
const REGION = process.env.S3_REGION ?? "ap-south-1";
const ACCESS = process.env.S3_ACCESS ?? "";
const SECRET = process.env.S3_SECRET ?? "";

/**
 * Public base URL. Set NEXT_PUBLIC_S3_BUCKET_URL to a CloudFront domain to
 * move delivery onto a CDN — nothing else in the codebase needs to change,
 * because keys are what gets stored.
 */
const PUBLIC_BASE =
  process.env.NEXT_PUBLIC_S3_BUCKET_URL?.replace(/\/$/, "") ||
  (BUCKET ? `https://${BUCKET}.s3.${REGION}.amazonaws.com` : "");

export const isS3Configured = Boolean(BUCKET && ACCESS && SECRET);

let client: S3Client | null = null;

/** Lazily constructed so importing this module never throws when unconfigured. */
function s3(): S3Client {
  if (!isS3Configured) {
    throw new Error(
      "S3 is not configured. Set S3_BUCKET, S3_REGION, S3_ACCESS and S3_SECRET."
    );
  }
  client ??= new S3Client({
    region: REGION,
    credentials: { accessKeyId: ACCESS, secretAccessKey: SECRET },
  });
  return client;
}

// ————————————————— Keys and URLs —————————————————

/** Strip anything that could escape the prefix or produce an ugly URL. */
export function safeSegment(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // strip combining accents
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^[.-]+|[.-]+$/g, "")
    .slice(0, 80);
}

/**
 * Build an object key. A short random suffix keeps SEO-friendly filenames
 * unique — two products called "Dune Taupe" from different catalogues must
 * not overwrite each other.
 */
export function buildKey(
  prefix: MediaPrefix,
  filename: string,
  opts?: { folder?: string; unique?: boolean }
): string {
  const dot = filename.lastIndexOf(".");
  const ext = dot > 0 ? filename.slice(dot + 1).toLowerCase() : "bin";
  const stem = safeSegment(dot > 0 ? filename.slice(0, dot) : filename) || "asset";

  const suffix =
    opts?.unique === false ? "" : `-${Math.random().toString(36).slice(2, 10)}`;

  const folder = opts?.folder
    ? opts.folder.split("/").map(safeSegment).filter(Boolean).join("/")
    : "";

  return [prefix, folder, `${stem}${suffix}.${safeSegment(ext)}`]
    .filter(Boolean)
    .join("/");
}

/**
 * Resolve a stored key to a public URL.
 *
 * Tolerates absolute URLs so legacy Cloudinary and /uploads paths still
 * render while the media library is being migrated.
 */
export function s3Url(key: string | null | undefined): string {
  if (!key) return "";
  if (key.startsWith("http://") || key.startsWith("https://")) return key;
  if (key.startsWith("/")) return key; // local /uploads during development
  return `${PUBLIC_BASE}/${key}`;
}

/** True when a stored value is an S3 key rather than a legacy absolute URL. */
export function isS3Key(value: string | null | undefined): boolean {
  if (!value) return false;
  if (value.startsWith("http") || value.startsWith("/")) return false;
  return MEDIA_PREFIXES.some((p) => value.startsWith(`${p}/`));
}

// ————————————————— Upload —————————————————

/**
 * Presigned PUT for browser-direct upload — the path bulk and large-file
 * uploads take, since bytes never touch the server.
 *
 * `contentType` is signed in, so the browser must send exactly the same value.
 */
export async function createUploadUrl(opts: {
  prefix: MediaPrefix;
  filename: string;
  contentType: string;
  folder?: string;
  expiresIn?: number;
}): Promise<{ uploadUrl: string; key: string; publicUrl: string }> {
  const key = buildKey(opts.prefix, opts.filename, { folder: opts.folder });

  const uploadUrl = await getSignedUrl(
    s3(),
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: opts.contentType,
      CacheControl: "public, max-age=31536000, immutable",
    }),
    { expiresIn: opts.expiresIn ?? 900 }
  );

  return { uploadUrl, key, publicUrl: s3Url(key) };
}

/**
 * Server-side put — the fallback when the browser can't reach S3 directly,
 * and the path catalogue imports use since they already hold the bytes.
 */
export async function putObject(opts: {
  key: string;
  body: Buffer | Uint8Array;
  contentType: string;
  cacheControl?: string;
}): Promise<{ key: string; publicUrl: string }> {
  await s3().send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: opts.key,
      Body: opts.body,
      ContentType: opts.contentType,
      CacheControl: opts.cacheControl ?? "public, max-age=31536000, immutable",
    })
  );
  return { key: opts.key, publicUrl: s3Url(opts.key) };
}

// ————————————————— Maintenance —————————————————

export async function deleteObject(key: string): Promise<void> {
  await s3().send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

/** Bulk delete. S3 caps DeleteObjects at 1000 keys per call, so this chunks. */
export async function deleteObjects(keys: string[]): Promise<void> {
  for (let i = 0; i < keys.length; i += 1000) {
    const chunk = keys.slice(i, i + 1000);
    if (chunk.length === 0) continue;
    await s3().send(
      new DeleteObjectsCommand({
        Bucket: BUCKET,
        Delete: { Objects: chunk.map((Key) => ({ Key })), Quiet: true },
      })
    );
  }
}

export async function objectExists(key: string): Promise<boolean> {
  try {
    await s3().send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
}

export interface S3Object {
  key: string;
  size: number;
  lastModified: Date | null;
  url: string;
}

/**
 * List a prefix, one page at a time. The media library pages through this
 * rather than loading a whole folder, which does not scale.
 */
export async function listObjects(opts: {
  prefix: string;
  continuationToken?: string;
  maxKeys?: number;
}): Promise<{ objects: S3Object[]; nextToken?: string }> {
  const res = await s3().send(
    new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: opts.prefix,
      ContinuationToken: opts.continuationToken,
      MaxKeys: opts.maxKeys ?? 100,
    })
  );

  return {
    objects: (res.Contents ?? [])
      .filter((o) => o.Key && !o.Key.endsWith("/"))
      .map((o) => ({
        key: o.Key!,
        size: o.Size ?? 0,
        lastModified: o.LastModified ?? null,
        url: s3Url(o.Key!),
      })),
    nextToken: res.IsTruncated ? res.NextContinuationToken : undefined,
  };
}
