import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { uploadFile, isS3Configured } from "@/lib/storage";

export { isS3Configured };

export function getS3Config() {
  const bucket = process.env.S3_BUCKET || process.env.AWS_S3_BUCKET || "your-prestige-in";
  const region = process.env.S3_REGION || process.env.AWS_REGION || "ap-south-1";
  /**
   * Custom endpoint, for an S3-compatible store or a local test double.
   * Unset in production, where the AWS endpoint is derived from the region.
   */
  const endpoint = process.env.S3_ENDPOINT?.trim() || undefined;
  const baseUrl = (
    process.env.NEXT_PUBLIC_S3_BUCKET_URL ||
    (endpoint ? `${endpoint.replace(/\/$/, "")}/${bucket}` : `https://${bucket}.s3.${region}.amazonaws.com`)
  ).replace(/\/$/, "");
  return { bucket, region, baseUrl, endpoint };
}

export function getS3Client(): S3Client {
  const { region, endpoint } = getS3Config();
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY?.trim();
  const sessionToken = process.env.AWS_SESSION_TOKEN?.trim();

  // Path-style addressing is required when an endpoint is set: a custom host
  // has no per-bucket subdomain to address virtually.
  const endpointOpts = endpoint ? { endpoint, forcePathStyle: true } : {};

  if (accessKeyId && secretAccessKey) {
    return new S3Client({
      region,
      ...endpointOpts,
      credentials: {
        accessKeyId,
        secretAccessKey,
        ...(sessionToken ? { sessionToken } : {}),
      },
    });
  }

  return new S3Client({ region, ...endpointOpts });
}

export const s3Client = new Proxy({} as S3Client, {
  get(_target, prop: keyof S3Client) {
    const client = getS3Client();
    const value = client[prop];
    return typeof value === "function" ? value.bind(client) : value;
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
  const { bucket, baseUrl } = getS3Config();

  if (isS3Configured()) {
    try {
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      });
      await s3Client.send(command);
      const url = `${baseUrl}/${key}`;
      return { url, key };
    } catch (err) {
      console.error("AWS S3 Direct Upload Error:", err);
      if (process.env.VERCEL) {
        throw err;
      }
    }
  }

  // Fallback to local media storage adapter in local dev when S3 is unconfigured
  const file = new File([new Uint8Array(buffer)], cleanFilename, { type: contentType });
  const result = await uploadFile(file, { folder });
  const objectUrl = result.url.startsWith("http") ? result.url : `${baseUrl}/${key}`;
  return { url: result.url.startsWith("/") ? result.url : objectUrl, key };
}

export async function uploadFileToS3(file: File, folder = "about"): Promise<{ url: string; key: string }> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return uploadBufferToS3(buffer, file.name, file.type || "image/jpeg", folder);
}

/**
 * Generate a presigned URL for direct client-side S3 upload.
 *
 * @deprecated Use `presignUpload` from `@/lib/media/s3-service`, which scopes
 * the key to its owning record. This remains only for the legacy
 * `/api/admin/s3-presigned` route.
 *
 * Two corrections from the original. `signableHeaders` now pins `content-type`
 * into the signature: without it `getSignedUrl` signs `host` alone, so the
 * `ContentType` handed to `PutObjectCommand` did nothing at all and the URL
 * would accept a PUT of any type — including `text/html` served back from the
 * media origin. And the expiry is fifteen minutes rather than an hour, since
 * the URL is used within seconds of being issued.
 */
export async function getPresignedUploadUrl(filename: string, contentType: string, folder = "products") {
  const { bucket, baseUrl } = getS3Config();
  const type = (contentType || "").split(";")[0].trim().toLowerCase();
  const key = `${folder}/${Date.now()}-${filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: type,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, {
    expiresIn: 900,
    signableHeaders: new Set(["content-type"]),
  });
  const objectUrl = `${baseUrl}/${key}`;

  return { uploadUrl, objectUrl, key, contentType: type };
}

/**
 * Delete an object from S3 given its key.
 */
export async function deleteS3Object(key: string) {
  if (!key) return { success: true };
  const { bucket } = getS3Config();
  try {
    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    });
    await s3Client.send(command);
    return { success: true };
  } catch (error) {
    console.error("S3 Delete Error:", error);
    return { success: false, error };
  }
}
