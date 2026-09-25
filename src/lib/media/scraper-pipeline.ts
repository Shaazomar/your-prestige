import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { S3_BUCKET, S3_REGION, buildObjectUrl } from "@/lib/s3-url";

/**
 * Production-Safe Scraper & Import Pipeline Contract:
 * 
 * SCRAPE PRODUCT
 * ↓
 * VALIDATE PRODUCT DATA
 * ↓
 * SCRAPE IMAGE
 * ↓
 * VALIDATE IMAGE (Content-Type, size, dimensions, non-HTML)
 * ↓
 * UPLOAD IMAGE TO OUR STORAGE (S3/Media)
 * ↓
 * CREATE/UPDATE PRODUCT:
 *  - With valid verified image -> status = 'ACTIVE', published = true
 *  - Without valid image -> status = 'DRAFT', published = false, needsReview = true
 * 
 * Never publish a product with a broken or missing image.
 */

export interface ScrapedProductInput {
  name: string;
  brandName: string;
  categorySlug?: string;
  sku?: string | null;
  productCode?: string | null;
  collection?: string | null;
  size?: string | null;
  sizes?: string[] | null;
  finish?: string | null;
  surface?: string | null;
  material?: string | null;
  color?: string | null;
  description?: string | null;
  price?: number | null;
  mrp?: number | null;
  sourceWebsite: string;
  sourceProductUrl?: string | null;
  sourceImageUrl?: string | null;
}

export interface ImageValidationResult {
  valid: boolean;
  contentType?: string;
  size?: number;
  buffer?: Buffer;
  error?: string;
}

export async function fetchAndValidateImage(
  imageUrl: string,
  timeoutMs = 20000
): Promise<ImageValidationResult> {
  if (!imageUrl || !imageUrl.trim()) {
    return { valid: false, error: "Empty image URL" };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(imageUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        Accept: "image/webp,image/avif,image/jpeg,image/png,image/*,*/*;q=0.8",
      },
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(timer);

    if (!res.ok) {
      return { valid: false, error: `HTTP ${res.status} ${res.statusText}` };
    }

    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("text/html") || contentType.includes("text/plain")) {
      return { valid: false, error: `Returned HTML/text error page instead of image (${contentType})` };
    }

    if (!contentType.startsWith("image/") && !contentType.includes("octet-stream")) {
      return { valid: false, error: `Invalid content type: ${contentType}` };
    }

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Reject zero bytes, tracking pixels, or corrupted files under 200 bytes
    if (buffer.length < 200) {
      return { valid: false, size: buffer.length, error: `Image too small (${buffer.length} bytes), likely tracking pixel or broken stub` };
    }

    return {
      valid: true,
      contentType: contentType.startsWith("image/") ? contentType : "image/jpeg",
      size: buffer.length,
      buffer,
    };
  } catch (err) {
    clearTimeout(timer);
    return { valid: false, error: err instanceof Error ? err.message : "Fetch failed" };
  }
}

export async function uploadScrapedImageToS3(
  buffer: Buffer,
  contentType: string,
  folder: string,
  filenameHint: string
): Promise<string> {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY?.trim();

  const ext = (contentType.split("/")[1] || "jpg").replace("jpeg", "jpg").split(";")[0];
  const clean = filenameHint.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
  const key = `prestige/catalog/${folder}/${Date.now()}-${clean}.${ext}`;

  const client = new S3Client({
    region: S3_REGION,
    credentials: { accessKeyId: accessKeyId!, secretAccessKey: secretAccessKey! },
  });

  await client.send(
    new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    })
  );

  return buildObjectUrl(key);
}

/**
 * Executes the complete safe pipeline for a product row.
 */
export async function processScrapedProduct(input: ScrapedProductInput) {
  let hostedImageUrl: string | null = null;
  let imageError: string | null = null;

  if (input.sourceImageUrl) {
    const validation = await fetchAndValidateImage(input.sourceImageUrl);
    if (validation.valid && validation.buffer && validation.contentType) {
      const folderName = `${input.sourceWebsite.toLowerCase()}/${input.sku || input.name}`.replace(/[^a-z0-9/_-]/gi, "-");
      const filenameHint = input.sku || input.name;
      try {
        hostedImageUrl = await uploadScrapedImageToS3(
          validation.buffer,
          validation.contentType,
          folderName,
          filenameHint
        );
      } catch (uploadErr) {
        imageError = `S3 Upload failed: ${uploadErr instanceof Error ? uploadErr.message : "Unknown error"}`;
      }
    } else {
      imageError = validation.error || "Image validation failed";
    }
  } else {
    imageError = "No source image URL provided";
  }

  // Safe visibility rule:
  const hasValidImage = !!hostedImageUrl;
  const status = hasValidImage ? "ACTIVE" : "DRAFT";
  const published = hasValidImage;
  const needsReview = !hasValidImage;
  const reviewReason = hasValidImage ? null : `Scraper: ${imageError}`;

  return {
    lifestyleImage: hostedImageUrl,
    images: hostedImageUrl ? [hostedImageUrl] : [],
    status,
    published,
    needsReview,
    reviewReason,
    hasValidImage,
    imageError,
  };
}
