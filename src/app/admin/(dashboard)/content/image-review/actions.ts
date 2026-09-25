"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { resolveImageRef, buildObjectUrl, S3_BUCKET } from "@/lib/s3-url";
import { getS3Client } from "@/lib/s3";
import { fetchAndValidateImage, uploadScrapedImageToS3 } from "@/lib/media/scraper-pipeline";
import { HeadObjectCommand } from "@aws-sdk/client-s3";

export type StatusTab = "missing" | "broken" | "recovered" | "review" | "all";

export interface ImageReviewRow {
  id: string;
  slug: string;
  name: string;
  brandName: string;
  brandSlug?: string;
  categoryName: string;
  sku: string | null;
  productCode: string | null;
  lifestyleImage: string | null;
  resolvedImage: string | null;
  thumbnailKey: string | null;
  imageKey: string | null;
  sourceProductUrl: string | null;
  sourceImageUrl: string | null;
  status: string;
  published: boolean;
  needsReview: boolean;
  reviewReason: string | null;
  imageHealth: "valid" | "missing" | "broken" | "recovered";
  recoveryConfidence?: "EXACT" | "HIGH" | "REVIEW" | "NOT_FOUND";
}

export interface ImageReviewStats {
  total: number;
  valid: number;
  missing: number;
  broken: number;
  needsReview: number;
  draftHidden: number;
}

const arr = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.length > 0) : [];

function extractS3Key(urlOrKey: string | null | undefined): string | null {
  if (!urlOrKey) return null;
  const str = urlOrKey.trim();
  if (!str.startsWith("http")) {
    return str.replace(/^\/+/, "");
  }
  try {
    const u = new URL(str);
    return decodeURIComponent(u.pathname.replace(/^\/+/, ""));
  } catch {
    return null;
  }
}

async function verifyImageQuick(urlOrKey: string | null | undefined): Promise<boolean> {
  if (!urlOrKey?.trim()) return false;
  const s3Key = extractS3Key(urlOrKey);
  if (s3Key && (urlOrKey.includes("amazonaws.com") || !urlOrKey.startsWith("http"))) {
    try {
      const head = await getS3Client().send(
        new HeadObjectCommand({ Bucket: S3_BUCKET, Key: s3Key })
      );
      return (head.ContentLength || 0) > 200;
    } catch {
      return false;
    }
  }
  const resolved = resolveImageRef(urlOrKey);
  if (resolved?.startsWith("http")) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 4000);
      const res = await fetch(resolved, { method: "HEAD", signal: ctrl.signal });
      clearTimeout(t);
      return res.ok && (res.headers.get("content-type") || "").startsWith("image/");
    } catch {
      return false;
    }
  }
  return false;
}

export async function getImageReviewStats(): Promise<ImageReviewStats> {
  await requirePermission("products", "view");

  const [total, draftHidden, needsReview, all] = await Promise.all([
    prisma.product.count({ where: { deletedAt: null } }),
    prisma.product.count({ where: { deletedAt: null, OR: [{ status: "DRAFT" }, { status: "ARCHIVED" }, { published: false }] } }),
    prisma.product.count({ where: { deletedAt: null, needsReview: true } }),
    prisma.product.findMany({
      where: { deletedAt: null },
      select: { lifestyleImage: true, textureImage: true, images: true, image_key: true, thumbnail_key: true },
    }),
  ]);

  let missing = 0;
  let valid = 0;
  for (const p of all) {
    const imgs = arr(p.images);
    const hasAny = !!(p.lifestyleImage?.trim() || imgs.length > 0 || p.image_key?.trim() || p.thumbnail_key?.trim());
    if (hasAny) {
      valid++;
    } else {
      missing++;
    }
  }

  return {
    total,
    valid,
    missing,
    broken: 0,
    needsReview,
    draftHidden,
  };
}

import { Prisma } from "@prisma/client";

export async function getImageReviewProducts(params: {
  tab: StatusTab;
  search?: string;
  brandId?: string;
  page?: number;
  limit?: number;
}): Promise<{ products: ImageReviewRow[]; total: number; page: number; totalPages: number }> {
  await requirePermission("products", "view");

  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(10, params.limit || 25));
  const skip = (page - 1) * limit;

  const where: Prisma.ProductWhereInput = { deletedAt: null };

  if (params.search?.trim()) {
    const q = params.search.trim();
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { slug: { contains: q, mode: "insensitive" } },
      { sku: { contains: q, mode: "insensitive" } },
      { productCode: { contains: q, mode: "insensitive" } },
    ];
  }

  if (params.brandId) {
    where.brandId = params.brandId;
  }

  if (params.tab === "missing") {
    where.lifestyleImage = null;
    where.image_key = null;
    where.thumbnail_key = null;
    where.textureImage = null;
  } else if (params.tab === "review") {
    where.needsReview = true;
  } else if (params.tab === "recovered") {
    where.needsReview = true;
    where.lifestyleImage = { not: null };
  }

  const [count, rows] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      include: {
        brand: { select: { name: true, slug: true } },
        category: { select: { name: true, slug: true } },
      },
      orderBy: [{ needsReview: "desc" }, { updatedAt: "desc" }],
      skip,
      take: limit,
    }),
  ]);

  const products: ImageReviewRow[] = rows.map((r) => {
    const imgs = arr(r.images);
    const candidate = r.lifestyleImage || imgs[0] || r.image_key || r.thumbnail_key || r.textureImage || null;
    const resolved = resolveImageRef(candidate);

    let imageHealth: ImageReviewRow["imageHealth"] = "missing";
    if (candidate) {
      imageHealth = r.needsReview ? "recovered" : "valid";
    }

    return {
      id: r.id,
      slug: r.slug,
      name: r.name,
      brandName: r.brand?.name || "Prestige",
      brandSlug: r.brand?.slug,
      categoryName: r.category?.name || "Tiles",
      sku: r.sku,
      productCode: r.productCode,
      lifestyleImage: r.lifestyleImage,
      resolvedImage: resolved,
      thumbnailKey: r.thumbnail_key,
      imageKey: r.image_key,
      sourceProductUrl: r.sourceProductUrl,
      sourceImageUrl: r.sourceImageUrl,
      status: r.status,
      published: r.published,
      needsReview: r.needsReview,
      reviewReason: r.reviewReason,
      imageHealth,
    };
  });

  return {
    products,
    total: count,
    page,
    totalPages: Math.ceil(count / limit),
  };
}

export async function updateProductImageAction(productId: string, imageUrl: string, publish = true) {
  const session = await requirePermission("products", "edit");
  const url = imageUrl.trim();
  if (!url) throw new Error("Image URL cannot be empty");

  const product = await prisma.product.findUniqueOrThrow({ where: { id: productId } });

  const resolved = resolveImageRef(url);
  const isValid = await verifyImageQuick(resolved);
  if (!isValid && publish) {
    throw new Error("Cannot publish product: Provided image URL could not be verified.");
  }

  const updated = await prisma.product.update({
    where: { id: productId },
    data: {
      lifestyleImage: url,
      images: [url],
      published: publish,
      status: publish ? "ACTIVE" : "DRAFT",
      needsReview: false,
      reviewReason: null,
    },
  });

  await logAudit({
    action: "product.image_update",
    entity: "Product",
    entityId: productId,
    oldValue: { lifestyleImage: product.lifestyleImage, status: product.status, published: product.published },
    newValue: { lifestyleImage: url, status: updated.status, published: updated.published },
    meta: { by: session.user.id, published: publish },
  });

  return { ok: true, product: updated };
}

export async function setProductVisibilityAction(productId: string, status: "ACTIVE" | "DRAFT" | "ARCHIVED", published: boolean) {
  const session = await requirePermission("products", "edit");
  const product = await prisma.product.findUniqueOrThrow({ where: { id: productId } });

  // Guard: Cannot set to ACTIVE/published if product has no image
  const imgs = arr(product.images);
  const hasImage = !!(product.lifestyleImage?.trim() || imgs.length > 0 || product.image_key?.trim() || product.thumbnail_key?.trim());
  if (published && !hasImage) {
    throw new Error("Rule violation: A product cannot be published without a valid product image.");
  }

  const updated = await prisma.product.update({
    where: { id: productId },
    data: {
      status,
      published,
      needsReview: !hasImage,
      reviewReason: hasImage ? null : "Missing product photography",
    },
  });

  await logAudit({
    action: "product.visibility_change",
    entity: "Product",
    entityId: productId,
    oldValue: { status: product.status, published: product.published },
    newValue: { status: updated.status, published: updated.published },
    meta: { by: session.user.id },
  });

  return { ok: true, product: updated };
}

export async function recoverSingleProductAction(productId: string) {
  await requirePermission("products", "edit");
  const product = await prisma.product.findUniqueOrThrow({
    where: { id: productId },
    include: { brand: true },
  });

  // Check 1: Existing sourceImageUrl
  if (product.sourceImageUrl?.trim()) {
    const val = await fetchAndValidateImage(product.sourceImageUrl);
    if (val.valid && val.buffer && val.contentType) {
      const folder = `${product.brand?.slug || "general"}/${product.sku || product.name}`.replace(/[^a-z0-9/_-]/gi, "-");
      const hosted = await uploadScrapedImageToS3(val.buffer, val.contentType, folder, product.sku || product.name);
      await prisma.product.update({
        where: { id: productId },
        data: {
          lifestyleImage: hosted,
          images: [hosted],
          published: true,
          status: "ACTIVE",
          needsReview: false,
          reviewReason: null,
        },
      });
      return { success: true, recovered: true, source: "sourceImageUrl", url: hosted };
    }
  }

  // Check 2: Existing thumbnail or image_key
  if (product.thumbnail_key || product.image_key) {
    const key = product.thumbnail_key || product.image_key;
    const url = buildObjectUrl(key!);
    const ok = await verifyImageQuick(url);
    if (ok) {
      await prisma.product.update({
        where: { id: productId },
        data: {
          lifestyleImage: url,
          images: [url],
          published: true,
          status: "ACTIVE",
          needsReview: false,
          reviewReason: null,
        },
      });
      return { success: true, recovered: true, source: "existingKey", url };
    }
  }

  return { success: false, recovered: false, message: "No verified image found in existing records or official source." };
}

export async function batchRecoverMissingAction(batchSize = 50) {
  await requirePermission("products", "edit");

  const candidates = await prisma.product.findMany({
    where: {
      deletedAt: null,
      lifestyleImage: null,
      image_key: null,
      thumbnail_key: null,
    },
    include: { brand: true },
    take: Math.min(100, Math.max(10, batchSize)),
  });

  let recovered = 0;
  let needsReview = 0;
  let notFound = 0;

  for (const p of candidates) {
    const res = await recoverSingleProductAction(p.id);
    if (res.recovered) {
      recovered++;
    } else if (p.sourceProductUrl) {
      needsReview++;
    } else {
      notFound++;
    }
  }

  return {
    totalProcessed: candidates.length,
    recovered,
    needsReview,
    notFound,
  };
}
