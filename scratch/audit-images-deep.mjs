import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const S3_BUCKET = process.env.S3_BUCKET || process.env.AWS_S3_BUCKET || "your-prestige-in";
const S3_REGION = process.env.S3_REGION || process.env.AWS_REGION || "ap-south-1";
const S3_ENDPOINT = process.env.S3_ENDPOINT?.trim() || undefined;
const S3_BASE_URL = (
  process.env.NEXT_PUBLIC_S3_BUCKET_URL ||
  (S3_ENDPOINT ? `${S3_ENDPOINT.replace(/\/$/, "")}/${S3_BUCKET}` : `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com`)
).replace(/\/+$/, "");

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

async function main() {
  const products = await prisma.product.findMany({
    select: {
      id: true,
      slug: true,
      name: true,
      sku: true,
      productCode: true,
      brandId: true,
      brand: { select: { name: true, slug: true } },
      categoryId: true,
      category: { select: { name: true, slug: true } },
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
    }
  });

  console.log(`Total products fetched: ${products.length}`);

  let hasLifestyle = 0;
  let hasTexture = 0;
  let hasImagesArray = 0;
  let hasImageKey = 0;
  let hasThumbnailKey = 0;
  let hasSourceImageUrl = 0;
  let hasSourceProductUrl = 0;
  let hasAnyImageRef = 0;
  let noImageAtAll = 0;

  const urlDomainCounts = {};
  const brandBreakdown = {};

  for (const p of products) {
    const brandName = p.brand?.name || 'Unknown';
    if (!brandBreakdown[brandName]) {
      brandBreakdown[brandName] = {
        total: 0,
        hasLifestyle: 0,
        hasImages: 0,
        hasImageKey: 0,
        hasThumbnailKey: 0,
        hasSourceImageUrl: 0,
        hasSourceProductUrl: 0,
        hasAny: 0,
        none: 0,
      };
    }
    const b = brandBreakdown[brandName];
    b.total++;

    if (p.lifestyleImage?.trim()) { hasLifestyle++; b.hasLifestyle++; }
    if (p.textureImage?.trim()) { hasTexture++; }
    const imgs = Array.isArray(p.images) ? p.images.filter(Boolean) : [];
    if (imgs.length > 0) { hasImagesArray++; b.hasImages++; }
    if (p.image_key?.trim()) { hasImageKey++; b.hasImageKey++; }
    if (p.thumbnail_key?.trim()) { hasThumbnailKey++; b.hasThumbnailKey++; }
    if (p.sourceImageUrl?.trim()) { hasSourceImageUrl++; b.hasSourceImageUrl++; }
    if (p.sourceProductUrl?.trim()) { hasSourceProductUrl++; b.hasSourceProductUrl++; }

    const any = (p.lifestyleImage?.trim()) || (imgs.length > 0) || (p.image_key?.trim()) || (p.thumbnail_key?.trim()) || (p.textureImage?.trim());
    if (any) {
      hasAnyImageRef++;
      b.hasAny++;
    } else {
      noImageAtAll++;
      b.none++;
    }

    // Inspect URL domain for primary candidate
    const candidate = p.lifestyleImage?.trim() || imgs[0] || p.image_key?.trim() || p.thumbnail_key?.trim();
    if (candidate) {
      const resolved = resolveImageRef(candidate);
      try {
        if (resolved.startsWith('http')) {
          const u = new URL(resolved);
          urlDomainCounts[u.hostname] = (urlDomainCounts[u.hostname] || 0) + 1;
        } else {
          urlDomainCounts['[relative/key]'] = (urlDomainCounts['[relative/key]'] || 0) + 1;
        }
      } catch {
        urlDomainCounts['[malformed]'] = (urlDomainCounts['[malformed]'] || 0) + 1;
      }
    }
  }

  console.log('--- FIELD SUMMARY ---');
  console.log({
    total: products.length,
    hasLifestyle,
    hasTexture,
    hasImagesArray,
    hasImageKey,
    hasThumbnailKey,
    hasSourceImageUrl,
    hasSourceProductUrl,
    hasAnyImageRef,
    noImageAtAll,
  });

  console.log('--- BRAND BREAKDOWN ---');
  console.table(brandBreakdown);

  console.log('--- URL HOSTS / FORMATS ---');
  console.log(urlDomainCounts);

  // Sample products with NO image
  const noImageSample = products.filter(p => !((p.lifestyleImage?.trim()) || (Array.isArray(p.images) && p.images.length > 0) || (p.image_key?.trim()) || (p.thumbnail_key?.trim()))).slice(0, 10);
  console.log('Sample 10 products with NO image at all:');
  console.log(noImageSample.map(p => ({
    id: p.id,
    name: p.name,
    brand: p.brand?.name,
    sku: p.sku || p.productCode,
    sourceProductUrl: p.sourceProductUrl,
    sourceImageUrl: p.sourceImageUrl,
  })));
}

main().catch(console.error).finally(() => prisma.$disconnect());
