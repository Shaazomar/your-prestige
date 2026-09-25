import { PrismaClient } from '@prisma/client';
import { S3Client, HeadObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { writeFile } from 'fs/promises';

const prisma = new PrismaClient();

const S3_BUCKET = process.env.S3_BUCKET || process.env.AWS_S3_BUCKET || "your-prestige-in";
const S3_REGION = process.env.S3_REGION || process.env.AWS_REGION || "ap-south-1";
const S3_BASE_URL = (
  process.env.NEXT_PUBLIC_S3_BUCKET_URL ||
  `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com`
).replace(/\/+$/, "");

const s3 = new S3Client({
  region: S3_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID?.trim(),
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY?.trim(),
  }
});

function buildObjectUrl(key) {
  const clean = key.replace(/^\/+/, "");
  const encoded = clean.split("/").map(encodeURIComponent).join("/");
  return `${S3_BASE_URL}/${encoded}`;
}

function resolveImageRef(ref) {
  const value = ref?.trim();
  if (!value) return null;
  if (/^https?:\/\//i.test(value) || value.startsWith("//") || value.startsWith("/")) {
    return value;
  }
  return buildObjectUrl(value);
}

function extractS3Key(urlOrKey) {
  if (!urlOrKey) return null;
  const str = urlOrKey.trim();
  if (!str.startsWith('http')) {
    return str.replace(/^\/+/, '');
  }
  try {
    const u = new URL(str);
    // e.g. pathname = /prestige/catalog/jaquar/123-abc.jpg
    return decodeURIComponent(u.pathname.replace(/^\/+/, ''));
  } catch {
    return null;
  }
}

async function pool(items, limit, worker) {
  let i = 0;
  const results = new Array(items.length);
  async function run() {
    while (i < items.length) {
      const idx = i++;
      try {
        results[idx] = await worker(items[idx], idx);
      } catch (e) {
        results[idx] = { error: e.message };
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return results;
}

// Memory cache of tested S3 keys
const keyCheckCache = new Map();

async function checkS3Key(key) {
  if (!key) return { exists: false, reason: 'empty_key' };
  if (keyCheckCache.has(key)) return keyCheckCache.get(key);

  try {
    const head = await s3.send(new HeadObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
    }));

    const contentLength = head.ContentLength || 0;
    const contentType = head.ContentType || '';
    
    // Check if valid image
    let valid = true;
    let reason = 'ok';

    if (contentLength === 0) {
      valid = false;
      reason = 'zero_bytes';
    } else if (contentType.includes('html') || contentType.includes('text')) {
      valid = false;
      reason = 'html_or_text_response';
    } else if (contentLength < 200) {
      // Very small file (possibly 1x1 or corrupted)
      valid = false;
      reason = 'tiny_corrupted_file';
    }

    const res = {
      exists: true,
      valid,
      reason,
      contentLength,
      contentType,
    };
    keyCheckCache.set(key, res);
    return res;
  } catch (err) {
    const name = err?.name;
    const status = err?.$metadata?.httpStatusCode;
    const res = {
      exists: false,
      valid: false,
      reason: (name === 'NotFound' || name === 'NoSuchKey' || status === 404) ? 'not_found' : `s3_error_${name || status || err.message}`,
      error: err.message,
    };
    keyCheckCache.set(key, res);
    return res;
  }
}

async function verifyHttpUrl(url) {
  if (!url) return { exists: false, valid: false, reason: 'empty_url' };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    let res = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow',
    });
    if (res.status === 405 || res.status === 501) {
      res = await fetch(url, {
        method: 'GET',
        headers: { Range: 'bytes=0-1000' },
        signal: controller.signal,
        redirect: 'follow',
      });
    }
    clearTimeout(timer);

    if (!res.ok) {
      return { exists: false, valid: false, status: res.status, reason: `http_${res.status}` };
    }
    const contentType = res.headers.get('content-type') || '';
    const contentLength = parseInt(res.headers.get('content-length') || '0', 10);
    if (!contentType.startsWith('image/')) {
      return { exists: true, valid: false, status: res.status, reason: `bad_content_type_${contentType}` };
    }
    return { exists: true, valid: true, status: res.status, contentType, contentLength, reason: 'ok' };
  } catch (e) {
    clearTimeout(timer);
    return { exists: false, valid: false, reason: `fetch_failed: ${e.message}` };
  }
}

async function main() {
  console.log('Fetching all products from Website Database...');
  const products = await prisma.product.findMany({
    select: {
      id: true,
      slug: true,
      name: true,
      sku: true,
      productCode: true,
      brandId: true,
      brand: { select: { id: true, name: true, slug: true } },
      categoryId: true,
      category: { select: { id: true, name: true, slug: true, parent: { select: { name: true, slug: true } } } },
      collection: true,
      size: true,
      sizes: true,
      finish: true,
      surface: true,
      lifestyleImage: true,
      textureImage: true,
      images: true,
      image_key: true,
      thumbnail_key: true,
      sourceWebsite: true,
      sourceProductUrl: true,
      sourceImageUrl: true,
      status: true,
      published: true,
      needsReview: true,
      reviewReason: true,
    },
    orderBy: { id: 'asc' },
  });

  console.log(`Loaded ${products.length} products. Starting live S3/HTTP verification...`);

  const results = await pool(products, 30, async (p, index) => {
    if (index % 500 === 0) {
      console.log(`Verifying: ${index} / ${products.length}...`);
    }

    const imgs = Array.isArray(p.images) ? p.images.filter(Boolean) : [];
    const primaryCandidate = p.lifestyleImage || imgs[0] || p.image_key || p.thumbnail_key || p.textureImage;

    let primaryStatus = 'missing';
    let primaryCheck = null;
    let resolvedPrimaryUrl = null;

    if (primaryCandidate) {
      resolvedPrimaryUrl = resolveImageRef(primaryCandidate);
      const s3Key = extractS3Key(primaryCandidate);
      if (s3Key) {
        primaryCheck = await checkS3Key(s3Key);
      } else if (resolvedPrimaryUrl?.startsWith('http')) {
        primaryCheck = await verifyHttpUrl(resolvedPrimaryUrl);
      } else {
        primaryCheck = { exists: false, valid: false, reason: 'invalid_url_format' };
      }

      if (primaryCheck.valid) {
        primaryStatus = 'valid';
      } else if (primaryCheck.exists) {
        primaryStatus = 'invalid'; // e.g. text/html, 0 bytes
      } else {
        primaryStatus = 'broken';
      }
    }

    // Also check thumbnail_key if different
    let thumbStatus = null;
    if (p.thumbnail_key) {
      const thumbKey = extractS3Key(p.thumbnail_key);
      const tCheck = await checkS3Key(thumbKey);
      thumbStatus = tCheck.valid ? 'valid' : 'broken';
    }

    // Check sourceImageUrl availability if primary is missing or broken
    let sourceImageCheck = null;
    if (primaryStatus !== 'valid' && p.sourceImageUrl) {
      // Source image url might be external or S3
      const s3Key = extractS3Key(p.sourceImageUrl);
      if (s3Key && (p.sourceImageUrl.includes('amazonaws.com') || !p.sourceImageUrl.startsWith('http'))) {
        sourceImageCheck = await checkS3Key(s3Key);
      } else if (p.sourceImageUrl.startsWith('http')) {
        sourceImageCheck = await verifyHttpUrl(p.sourceImageUrl);
      }
    }

    return {
      product: p,
      primaryCandidate,
      resolvedPrimaryUrl,
      primaryStatus,
      primaryCheck,
      thumbStatus,
      sourceImageCheck,
    };
  });

  console.log('Verification completed. Analyzing results...');

  let validCount = 0;
  let missingCount = 0;
  let brokenCount = 0;
  let invalidCount = 0;
  let recoverableExisting = 0;
  let recoverableExternal = 0;
  let unrecoverable = 0;

  const statusByBrand = {};
  const issuesList = [];

  for (const r of results) {
    const brand = r.product.brand?.name || 'Unknown';
    if (!statusByBrand[brand]) {
      statusByBrand[brand] = { total: 0, valid: 0, missing: 0, broken: 0, invalid: 0, recoverable: 0, unrecoverable: 0 };
    }
    const b = statusByBrand[brand];
    b.total++;

    if (r.primaryStatus === 'valid') {
      validCount++;
      b.valid++;
    } else if (r.primaryStatus === 'missing') {
      missingCount++;
      b.missing++;
      issuesList.push(r);
    } else if (r.primaryStatus === 'broken') {
      brokenCount++;
      b.broken++;
      issuesList.push(r);
    } else {
      invalidCount++;
      b.invalid++;
      issuesList.push(r);
    }

    // Recovery check
    if (r.primaryStatus !== 'valid') {
      if (r.thumbStatus === 'valid' || (r.sourceImageCheck && r.sourceImageCheck.valid)) {
        recoverableExisting++;
        b.recoverable++;
      } else if (r.product.sourceProductUrl || (r.product.brand && (r.product.sku || r.product.productCode || r.product.name))) {
        // Can attempt manufacturer scrape/lookup
        recoverableExternal++;
        b.recoverable++;
      } else {
        unrecoverable++;
        b.unrecoverable++;
      }
    }
  }

  console.log('==================================================');
  console.log('AUDIT REPORT SUMMARY');
  console.log('==================================================');
  console.log(`TOTAL PRODUCTS: ${products.length}`);
  console.log(`VALID IMAGE: ${validCount}`);
  console.log(`MISSING IMAGE: ${missingCount}`);
  console.log(`BROKEN IMAGE: ${brokenCount}`);
  console.log(`INVALID URL / OBJECT: ${invalidCount}`);
  console.log(`RECOVERABLE (EXISTING MEDIA): ${recoverableExisting}`);
  console.log(`RECOVERABLE (EXTERNAL / MANUFACTURER): ${recoverableExternal}`);
  console.log(`UNRECOVERABLE: ${unrecoverable}`);
  console.log('==================================================');
  console.log('BRAND BREAKDOWN:');
  console.table(statusByBrand);

  await writeFile('scratch/audit_results_full.json', JSON.stringify({
    summary: {
      total: products.length,
      valid: validCount,
      missing: missingCount,
      broken: brokenCount,
      invalid: invalidCount,
      recoverableExisting,
      recoverableExternal,
      unrecoverable,
    },
    statusByBrand,
    issues: issuesList.map(i => ({
      id: i.product.id,
      slug: i.product.slug,
      name: i.product.name,
      brand: i.product.brand?.name,
      sku: i.product.sku || i.product.productCode,
      category: i.product.category?.name,
      parentCategory: i.product.category?.parent?.name,
      primaryCandidate: i.primaryCandidate,
      resolvedPrimaryUrl: i.resolvedPrimaryUrl,
      primaryStatus: i.primaryStatus,
      checkReason: i.primaryCheck?.reason,
      sourceProductUrl: i.product.sourceProductUrl,
      sourceImageUrl: i.product.sourceImageUrl,
    }))
  }, null, 2));

  console.log('Full results written to scratch/audit_results_full.json');
}

main().catch(console.error).finally(() => prisma.$disconnect());
