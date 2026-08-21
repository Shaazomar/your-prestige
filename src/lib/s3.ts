import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { uploadFile } from "@/lib/storage";

const S3_BUCKET = process.env.S3_BUCKET || process.env.AWS_S3_BUCKET || "your-prestige-in";
const S3_REGION = process.env.S3_REGION || process.env.AWS_REGION || "ap-south-1";
const S3_BASE_URL = process.env.NEXT_PUBLIC_S3_BUCKET_URL || `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com`;

export const s3Client = new S3Client({
  region: S3_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

export async function uploadBufferToS3(
  buffer: Buffer,
  filename: string,
  contentType: string,
  folder = "about"
): Promise<{ url: string; key: string }> {
  const cleanFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const key = `${folder}/${Date.now()}-${cleanFilename}`;

  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    try {
      const command = new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      });
      await s3Client.send(command);
      const url = `${S3_BASE_URL}/${key}`;
      return { url, key };
    } catch (err) {
      console.warn("AWS S3 Direct Upload Error, using fallback:", err);
    }
  }

  // Fallback to media storage adapter
  const file = new File([new Uint8Array(buffer)], cleanFilename, { type: contentType });
  const result = await uploadFile(file, { folder });
  const objectUrl = result.url.startsWith("http") ? result.url : `${S3_BASE_URL}/${key}`;
  return { url: result.url.startsWith("/") ? result.url : objectUrl, key };
}

export async function uploadFileToS3(file: File, folder = "about"): Promise<{ url: string; key: string }> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return uploadBufferToS3(buffer, file.name, file.type || "image/jpeg", folder);
}

/**
 * Generate a presigned URL for direct client-side S3 upload.
 */
export async function getPresignedUploadUrl(filename: string, contentType: string, folder = "products") {
  const key = `${folder}/${Date.now()}-${filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  const objectUrl = `${S3_BASE_URL}/${key}`;

  return { uploadUrl, objectUrl, key };
}

/**
 * Delete an object from S3 given its key.
 */
export async function deleteS3Object(key: string) {
  if (!key) return { success: true };
  try {
    const command = new DeleteObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
    });
    await s3Client.send(command);
    return { success: true };
  } catch (error) {
    console.error("S3 Delete Error:", error);
    return { success: false, error };
  }
}
