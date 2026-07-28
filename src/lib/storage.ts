import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export interface UploadResult {
  url: string;
  publicId?: string;
  width?: number;
  height?: number;
}

const cloudinaryConfigured = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

/**
 * Storage adapter — uploads to Cloudinary when configured (production),
 * falls back to local disk under public/uploads (dev only; most hosts,
 * including Vercel, have an ephemeral/read-only filesystem in production,
 * so Cloudinary credentials are a hard requirement before deploying).
 */
export async function uploadFile(file: File): Promise<UploadResult> {
  if (cloudinaryConfigured) {
    return uploadToCloudinary(file);
  }
  if (process.env.VERCEL) {
    throw new Error(
      "Media upload requires Cloudinary credentials in production (CLOUDINARY_CLOUD_NAME / _API_KEY / _API_SECRET) — the local-disk fallback only works in local development."
    );
  }
  return uploadToLocalDisk(file);
}

async function uploadToCloudinary(file: File): Promise<UploadResult> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME!;
  const apiKey = process.env.CLOUDINARY_API_KEY!;
  const apiSecret = process.env.CLOUDINARY_API_SECRET!;

  const timestamp = Math.floor(Date.now() / 1000);
  // Signed upload — signature is sha1(params sorted + secret)
  const paramsToSign = `folder=prestige&timestamp=${timestamp}${apiSecret}`;
  const { createHash } = await import("crypto");
  const signature = createHash("sha1").update(paramsToSign).digest("hex");

  const form = new FormData();
  form.append("file", file);
  form.append("api_key", apiKey);
  form.append("timestamp", String(timestamp));
  form.append("folder", "prestige");
  form.append("signature", signature);

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

async function uploadToLocalDisk(file: File): Promise<UploadResult> {
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });

  const ext = file.name.split(".").pop() || "bin";
  const filename = `${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadsDir, filename), buffer);

  return { url: `/uploads/${filename}` };
}

export const isCloudinaryConfigured = cloudinaryConfigured;
