/**
 * Central Amazon S3 Storage Utility for Prestige Tiles Enterprise Assets
 * Configured via environment variables (NEXT_PUBLIC_S3_BUCKET_URL or S3_BUCKET_URL).
 */

const DEFAULT_S3_BASE =
  process.env.NEXT_PUBLIC_S3_BUCKET_URL ||
  process.env.S3_BUCKET_URL ||
  "https://prestige-assets.s3.amazonaws.com";

export function getS3Url(path: string): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  return `${DEFAULT_S3_BASE}/${cleanPath}`;
}

export function buildProductS3Path(sku: string, filename: string): string {
  const cleanSku = sku.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "_");
  return `products/${cleanSku}/${filename}`;
}

export function buildCollectionS3Path(collectionSlug: string, filename: string): string {
  return `collections/${collectionSlug}/${filename}`;
}

export function buildBrochureS3Path(filename: string): string {
  return `brochures/${filename}`;
}

export function buildTechnicalS3Path(sku: string, filename: string): string {
  return `technical/${sku.trim().toUpperCase()}/${filename}`;
}

export interface S3ImageMedia {
  url: string;
  order: number;
  type: "cover" | "gallery" | "lifestyle" | "technical" | "360" | "video";
  alt?: string;
}
