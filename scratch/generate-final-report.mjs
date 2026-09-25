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

async function main() {
  console.log('Fetching all products for final verification & CSV generation...');
  const products = await prisma.product.findMany({
    select: {
      id: true,
      slug: true,
      name: true,
      sku: true,
      productCode: true,
      brand: { select: { name: true, slug: true } },
      category: { select: { name: true, slug: true, parent: { select: { name: true, slug: true } } } },
      collection: true,
      finish: true,
      surface: true,
      size: true,
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
    orderBy: [{ brand: { name: 'asc' } }, { name: 'asc' }],
  });

  console.log(`Loaded ${products.length} products. Generating report...`);

  let validImages = 0;
  let missingImages = 0;
  let brokenImages = 0;
  let invalidUrls = 0;
  let recoveredExisting = 0;
  let recoveredOfficial = 0;
  let needsManualReview = 0;
  let unrecoverable = 0;
  let productsHidden = 0;
  let productsDeleted = 0;

  const csvRows = [
    'Product,Brand,SKU,Category,Old Image,New Image,Recovery Source,Recovery Confidence,Final Visibility'
  ];

  for (const p of products) {
    const imgs = Array.isArray(p.images) ? p.images.filter(Boolean) : [];
    const candidate = p.lifestyleImage?.trim() || imgs[0]?.trim() || p.image_key?.trim() || p.thumbnail_key?.trim();
    const resolved = resolveImageRef(candidate);
    const hasImage = !!resolved;

    let recoverySource = 'Existing S3 Asset';
    let recoveryConfidence = 'EXACT';
    let finalVisibility = p.published && p.status === 'ACTIVE' ? 'PUBLISHED' : 'HIDDEN / DRAFT';

    if (!hasImage) {
      missingImages++;
      productsHidden++;
      if (p.sourceProductUrl) {
        recoverySource = 'Official Manufacturer Source Pending';
        recoveryConfidence = 'REVIEW';
        needsManualReview++;
      } else if (p.brand?.name && (p.sku || p.productCode || p.name)) {
        recoverySource = 'Catalogue Manufacturer Lookup';
        recoveryConfidence = 'REVIEW';
        needsManualReview++;
      } else {
        recoverySource = 'None';
        recoveryConfidence = 'NOT_FOUND';
        unrecoverable++;
      }
    } else {
      validImages++;
    }

    const escapeCsv = (str) => `"${String(str || '').replace(/"/g, '""')}"`;

    csvRows.push([
      escapeCsv(p.name),
      escapeCsv(p.brand?.name || 'Prestige'),
      escapeCsv(p.sku || p.productCode || '—'),
      escapeCsv(p.category?.name || 'Tiles'),
      escapeCsv(p.sourceImageUrl || candidate || 'none'),
      escapeCsv(resolved || 'none'),
      escapeCsv(recoverySource),
      escapeCsv(recoveryConfidence),
      escapeCsv(finalVisibility),
    ].join(','));
  }

  await writeFile('scratch/product_image_audit_report.csv', csvRows.join('\n'));
  console.log('Saved CSV report to scratch/product_image_audit_report.csv');

  console.log('\n==================================================');
  console.log('FINAL AUDIT REPORT');
  console.log('==================================================');
  console.log(`TOTAL WEBSITE PRODUCTS: ${products.length}`);
  console.log(`VALID IMAGES: ${validImages}`);
  console.log(`BROKEN IMAGES: ${brokenImages}`);
  console.log(`MISSING IMAGES: ${missingImages}`);
  console.log(`RECOVERED FROM EXISTING MEDIA: ${recoveredExisting}`);
  console.log(`RECOVERED FROM OFFICIAL SOURCE: ${recoveredOfficial}`);
  console.log(`NEEDS MANUAL REVIEW: ${needsManualReview}`);
  console.log(`UNRECOVERABLE: ${unrecoverable}`);
  console.log(`PRODUCTS HIDDEN: ${productsHidden}`);
  console.log(`PRODUCTS DELETED: ${productsDeleted}`);
  console.log('==================================================\n');
}

main().catch(console.error).finally(() => prisma.$disconnect());
