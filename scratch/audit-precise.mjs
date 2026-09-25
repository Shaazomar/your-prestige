import { PrismaClient } from '@prisma/client';
import { S3Client, HeadObjectCommand } from '@aws-sdk/client-s3';
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
  maxAttempts: 5,
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
    return decodeURIComponent(u.pathname.replace(/^\/+/, ''));
  } catch {
    return null;
  }
}

const keyCache = new Map();

async function checkS3KeyWithRetry(key) {
  if (!key) return { exists: false, valid: false, reason: 'empty_key' };
  if (keyCache.has(key)) return keyCache.get(key);

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const head = await s3.send(new HeadObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
      }));

      const contentLength = head.ContentLength || 0;
      const contentType = head.ContentType || '';
      
      let valid = true;
      let reason = 'ok';

      if (contentLength === 0) {
        valid = false;
        reason = 'zero_bytes';
      } else if (contentType.includes('html') || contentType.includes('text')) {
        valid = false;
        reason = 'html_or_text_response';
      } else if (contentLength < 200) {
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
      keyCache.set(key, res);
      return res;
    } catch (err) {
      const name = err?.name;
      const status = err?.$metadata?.httpStatusCode;
      if (name === 'NotFound' || name === 'NoSuchKey' || status === 404) {
        const res = { exists: false, valid: false, reason: 'not_found' };
        keyCache.set(key, res);
        return res;
      }
      if (attempt < 2) {
        await new Promise(r => setTimeout(r, 200 * (attempt + 1)));
      } else {
        const res = { exists: false, valid: false, reason: `error_${name || status || err.message}`, error: err.message };
        keyCache.set(key, res);
        return res;
      }
    }
  }
}

async function verifyHttpUrl(url) {
  if (!url) return { exists: false, valid: false, reason: 'empty_url' };
  for (let attempt = 0; attempt < 3; attempt++) {
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
      if (attempt >= 2) {
        return { exists: false, valid: false, reason: `fetch_failed: ${e.message}` };
      }
      await new Promise(r => setTimeout(r, 200 * (attempt + 1)));
    }
  }
}

async function main() {
  console.log('Fetching all products from DB...');
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
      finish: true,
      surface: true,
      size: true,
      sizes: true,
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

  console.log(`Fetched ${products.length} products. Scanning image candidates...`);

  // Batch process with concurrency 15
  const limit = 15;
  let idx = 0;
  const verifiedList = new Array(products.length);

  async function worker() {
    while (idx < products.length) {
      const current = idx++;
      const p = products[current];
      if (current % 500 === 0) {
        console.log(`Progress: ${current} / ${products.length} (${Math.round(current / products.length * 100)}%)`);
      }

      const imgs = Array.isArray(p.images) ? p.images.filter(Boolean) : [];
      
      // Check candidate images in priority order:
      // 1. lifestyleImage
      // 2. images[0]
      // 3. image_key
      // 4. thumbnail_key
      // 5. textureImage
      const candidates = [
        { field: 'lifestyleImage', val: p.lifestyleImage },
        { field: 'images[0]', val: imgs[0] },
        { field: 'image_key', val: p.image_key },
        { field: 'thumbnail_key', val: p.thumbnail_key },
        { field: 'textureImage', val: p.textureImage },
      ].filter(c => !!c.val?.trim());

      let foundValid = null;
      let primaryCandidate = candidates[0]?.val || null;
      let primaryField = candidates[0]?.field || null;
      let primaryStatus = 'missing';
      let primaryReason = 'no_image_fields';
      let primaryResolvedUrl = null;

      for (const cand of candidates) {
        const resolved = resolveImageRef(cand.val);
        const s3Key = extractS3Key(cand.val);
        let check;
        if (s3Key && (cand.val.includes('amazonaws.com') || !cand.val.startsWith('http'))) {
          check = await checkS3KeyWithRetry(s3Key);
        } else if (resolved?.startsWith('http')) {
          check = await verifyHttpUrl(resolved);
        } else {
          check = { exists: false, valid: false, reason: 'invalid_url_format' };
        }

        if (cand === candidates[0]) {
          primaryResolvedUrl = resolved;
          if (check.valid) {
            primaryStatus = 'valid';
            primaryReason = 'ok';
          } else if (check.exists) {
            primaryStatus = 'invalid';
            primaryReason = check.reason;
          } else {
            primaryStatus = 'broken';
            primaryReason = check.reason;
          }
        }

        if (check.valid) {
          foundValid = {
            field: cand.field,
            val: cand.val,
            resolvedUrl: resolved,
            contentLength: check.contentLength,
            contentType: check.contentType,
          };
          break; // Stop at first valid
        }
      }

      // Check existing media fallbacks if primary is not valid
      let fallbackValid = null;
      if (!foundValid) {
        // Check sourceImageUrl
        if (p.sourceImageUrl) {
          const s3Key = extractS3Key(p.sourceImageUrl);
          let sCheck;
          if (s3Key && (p.sourceImageUrl.includes('amazonaws.com') || !p.sourceImageUrl.startsWith('http'))) {
            sCheck = await checkS3KeyWithRetry(s3Key);
          } else if (p.sourceImageUrl.startsWith('http')) {
            sCheck = await verifyHttpUrl(p.sourceImageUrl);
          }
          if (sCheck?.valid) {
            fallbackValid = {
              source: 'sourceImageUrl',
              url: p.sourceImageUrl,
            };
          }
        }
      }

      verifiedList[current] = {
        product: p,
        primaryCandidate,
        primaryField,
        primaryResolvedUrl,
        primaryStatus: foundValid ? 'valid' : primaryStatus,
        primaryReason: foundValid ? 'ok' : primaryReason,
        validImageSource: foundValid,
        fallbackValid,
      };
    }
  }

  await Promise.all(Array.from({ length: limit }, worker));

  console.log('Verification finished. Computing exact counts...');

  let totalValid = 0;
  let totalMissing = 0;
  let totalBroken = 0;
  let totalInvalid = 0;
  let recoverableExisting = 0;
  let recoverableExternal = 0;
  let unrecoverable = 0;

  const brandStats = {};
  const problemProducts = [];

  for (const item of verifiedList) {
    const brandName = item.product.brand?.name || 'Unknown';
    if (!brandStats[brandName]) {
      brandStats[brandName] = {
        total: 0,
        valid: 0,
        missing: 0,
        broken: 0,
        invalid: 0,
        recoverableExisting: 0,
        recoverableExternal: 0,
        unrecoverable: 0,
      };
    }
    const bs = brandStats[brandName];
    bs.total++;

    if (item.primaryStatus === 'valid') {
      totalValid++;
      bs.valid++;
    } else if (item.primaryStatus === 'missing') {
      totalMissing++;
      bs.missing++;
      problemProducts.push(item);
    } else if (item.primaryStatus === 'broken') {
      totalBroken++;
      bs.broken++;
      problemProducts.push(item);
    } else {
      totalInvalid++;
      bs.invalid++;
      problemProducts.push(item);
    }

    if (item.primaryStatus !== 'valid') {
      if (item.fallbackValid) {
        recoverableExisting++;
        bs.recoverableExisting++;
      } else if (item.product.sourceProductUrl || (item.product.brand && (item.product.sku || item.product.productCode || item.product.name))) {
        recoverableExternal++;
        bs.recoverableExternal++;
      } else {
        unrecoverable++;
        bs.unrecoverable++;
      }
    }
  }

  console.log('\n==================================================');
  console.log('EXACT AUDIT RESULTS ACROSS ALL 6,215 PRODUCTS');
  console.log('==================================================');
  console.log(`TOTAL WEBSITE PRODUCTS: ${products.length}`);
  console.log(`VALID IMAGES: ${totalValid}`);
  console.log(`MISSING IMAGES: ${totalMissing}`);
  console.log(`BROKEN IMAGES: ${totalBroken}`);
  console.log(`INVALID URL / OBJECTS: ${totalInvalid}`);
  console.log(`RECOVERABLE FROM EXISTING MEDIA: ${recoverableExisting}`);
  console.log(`RECOVERABLE FROM OFFICIAL / EXTERNAL: ${recoverableExternal}`);
  console.log(`UNRECOVERABLE: ${unrecoverable}`);
  console.log('==================================================\n');

  console.table(brandStats);

  // Write out precise problem products
  await writeFile('scratch/audit_problem_products.json', JSON.stringify({
    summary: {
      total: products.length,
      valid: totalValid,
      missing: totalMissing,
      broken: totalBroken,
      invalid: totalInvalid,
      recoverableExisting,
      recoverableExternal,
      unrecoverable,
    },
    brandStats,
    problemProducts: problemProducts.map(p => ({
      id: p.product.id,
      slug: p.product.slug,
      name: p.product.name,
      brand: p.product.brand?.name,
      sku: p.product.sku || p.product.productCode,
      category: p.product.category?.name,
      parentCategory: p.product.category?.parent?.name,
      primaryCandidate: p.primaryCandidate,
      primaryStatus: p.primaryStatus,
      primaryReason: p.primaryReason,
      sourceProductUrl: p.product.sourceProductUrl,
      sourceImageUrl: p.product.sourceImageUrl,
      fallbackValid: p.fallbackValid,
      status: p.product.status,
      published: p.product.published,
    })),
  }, null, 2));

  console.log(`Saved ${problemProducts.length} problem products to scratch/audit_problem_products.json`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
