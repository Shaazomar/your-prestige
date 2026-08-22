import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export interface UploadResult {
  url: string;
  publicId?: string;
  width?: number;
  height?: number;
}

export interface UploadOptions {
  /**
   * Destination folder, relative to the `prestige` root — e.g.
   * "catalog/somany/dune-collection". Catalog imports use this to mirror the
   * Brand / Collection / Product tree into storage. Defaults to the root.
   */
  folder?: string;
  /**
   * SEO filename (no extension), e.g. "somany-dune-taupe-800x1600-matt".
   * When omitted the file keeps a random name, which is what the generic
   * media uploader has always done.
   */
  filename?: string;
}

const cloudinaryConfigured = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

const s3Configured = !!(
  process.env.AWS_ACCESS_KEY_ID &&
  process.env.AWS_SECRET_ACCESS_KEY &&
  process.env.AWS_ACCESS_KEY_ID.trim() !== "" &&
  !process.env.AWS_ACCESS_KEY_ID.includes("your_")
);

const ROOT_FOLDER = "prestige";

/** Strip anything that could escape the uploads dir or upset storage. */
function safeSegment(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^[.-]+|[.-]+$/g, "")
    .slice(0, 80);
}

function safeFolder(folder?: string): string {
  if (!folder) return ROOT_FOLDER;
  const parts = folder.split("/").map(safeSegment).filter(Boolean);
  return [ROOT_FOLDER, ...parts].join("/");
}

/**
 * Storage adapter — uploads to AWS S3 or Cloudinary when configured (production),
 * falls back to local disk under public/uploads (dev only).
 */
export async function uploadFile(file: File, opts?: UploadOptions): Promise<UploadResult> {
  if (s3Configured) {
    try {
      return await uploadToS3(file, opts);
    } catch (s3Err) {
      console.warn("AWS S3 Upload Error:", s3Err);
      if (!process.env.VERCEL) {
        console.log("S3 upload failed in local dev; falling back to local disk storage.");
        return uploadToLocalDisk(file, opts);
      }
      throw s3Err;
    }
  }
  if (cloudinaryConfigured) {
    return uploadToCloudinary(file, opts);
  }
  if (process.env.VERCEL) {
    throw new Error(
      "Media upload requires valid AWS S3 credentials (AWS_ACCESS_KEY_ID & AWS_SECRET_ACCESS_KEY) or Cloudinary credentials in production."
    );
  }
  return uploadToLocalDisk(file, opts);
}

async function uploadToS3(file: File, opts?: UploadOptions): Promise<UploadResult> {
  const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
  const bucket = process.env.S3_BUCKET || process.env.AWS_S3_BUCKET || "your-prestige-in";
  const region = process.env.S3_REGION || process.env.AWS_REGION || "ap-south-1";
  const baseUrl = (
    process.env.NEXT_PUBLIC_S3_BUCKET_URL || `https://${bucket}.s3.${region}.amazonaws.com`
  ).replace(/\/$/, "");

  const client = new S3Client({
    region,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const folder = safeFolder(opts?.folder);
  const cleanName = (opts?.filename || file.name).replace(/[^a-zA-Z0-9._-]/g, "_");
  const key = `${folder}/${Date.now()}-${cleanName}`;

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: file.type || "application/octet-stream",
  });

  await client.send(command);
  const url = `${baseUrl}/${key}`;
  return { url, publicId: key };
}

async function uploadToCloudinary(file: File, opts?: UploadOptions): Promise<UploadResult> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME!;
  const apiKey = process.env.CLOUDINARY_API_KEY!;
  const apiSecret = process.env.CLOUDINARY_API_SECRET!;

  const timestamp = Math.floor(Date.now() / 1000);

  // Every signed param must appear in the signature, sorted by key, joined
  // with & — omitting one (or signing a param you don't send) fails with an
  // opaque 401 from Cloudinary.
  const signed: Record<string, string> = {
    folder: safeFolder(opts?.folder),
    timestamp: String(timestamp),
  };
  if (opts?.filename) signed.public_id = safeSegment(opts.filename);

  const paramsToSign = Object.keys(signed)
    .sort()
    .map((k) => `${k}=${signed[k]}`)
    .join("&");
  const { createHash } = await import("crypto");
  const signature = createHash("sha1").update(paramsToSign + apiSecret).digest("hex");

  const form = new FormData();
  form.append("file", file);
  form.append("api_key", apiKey);
  form.append("signature", signature);
  for (const [k, v] of Object.entries(signed)) form.append(k, v);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Cloudinary upload failed: ${text}`);
  }
  const data = await res.json();
  return { url: data.secure_url, publicId: data.public_id, width: data.width, height: data.height };
}

async function uploadToLocalDisk(file: File, opts?: UploadOptions): Promise<UploadResult> {
  // Mirror the Cloudinary tree on disk, minus the `prestige` root namespace —
  // /public/uploads is already the equivalent of that root.
  const relFolder = safeFolder(opts?.folder).split("/").slice(1).join("/");
  const uploadsDir = path.join(process.cwd(), "public", "uploads", relFolder);
  await mkdir(uploadsDir, { recursive: true });

  const ext = file.name.split(".").pop() || "bin";
  // A short random suffix keeps SEO filenames unique without a lookup — two
  // products named "Dune Taupe" in different catalogues can't clobber each other.
  const filename = opts?.filename
    ? `${safeSegment(opts.filename)}-${randomUUID().slice(0, 8)}.${ext}`
    : `${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadsDir, filename), buffer);

  return { url: `/uploads/${relFolder ? `${relFolder}/` : ""}${filename}` };
}

export const isCloudinaryConfigured = cloudinaryConfigured;

/**
 * Can we write media at all right now? Catalog imports call this up front so a
 * 100-page run fails at upload time with a clear message, rather than 40 pages in.
 */
export function canUploadMedia(): { ok: boolean; reason?: string } {
  if (cloudinaryConfigured) return { ok: true };
  if (process.env.VERCEL) {
    return {
      ok: false,
      reason:
        "Media storage is not configured. Catalog imports write hundreds of images, which needs Cloudinary credentials (CLOUDINARY_CLOUD_NAME / _API_KEY / _API_SECRET) in production.",
    };
  }
  return { ok: true };
}
