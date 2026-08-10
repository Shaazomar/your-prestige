import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const S3_BUCKET = process.env.AWS_S3_BUCKET || "prestige-tiles-media";
const S3_REGION = process.env.AWS_REGION || "ap-south-1";

export const s3Client = new S3Client({
  region: S3_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

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
  const objectUrl = `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${key}`;

  return { uploadUrl, objectUrl, key };
}

/**
 * Delete an object from S3 given its key.
 */
export async function deleteS3Object(key: string) {
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
