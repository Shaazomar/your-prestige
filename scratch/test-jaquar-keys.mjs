import { PrismaClient } from '@prisma/client';
import { S3Client, HeadObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';

const prisma = new PrismaClient();

const S3_BUCKET = process.env.S3_BUCKET || process.env.AWS_S3_BUCKET || "your-prestige-in";
const S3_REGION = process.env.S3_REGION || process.env.AWS_REGION || "ap-south-1";

const s3 = new S3Client({
  region: S3_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID?.trim(),
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY?.trim(),
  }
});

async function main() {
  const jaquar = await prisma.product.findMany({
    where: { brand: { name: 'Jaquar' } },
    take: 5,
    select: {
      id: true,
      name: true,
      sku: true,
      lifestyleImage: true,
      images: true,
      sourceWebsite: true,
      sourceProductUrl: true,
      sourceImageUrl: true,
    }
  });

  for (const p of jaquar) {
    console.log('\nChecking product:', p.name, 'SKU:', p.sku);
    console.log('lifestyleImage:', p.lifestyleImage);
    const u = new URL(p.lifestyleImage);
    const key = decodeURIComponent(u.pathname.replace(/^\/+/, ''));
    console.log('Extracted key:', key);

    try {
      const head = await s3.send(new HeadObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
      }));
      console.log('S3 Head Success! Size:', head.ContentLength, 'ContentType:', head.ContentType);
    } catch (e) {
      console.log('S3 Head Error:', e.name, e.$metadata?.httpStatusCode, e.message);
    }

    // Let's also check if there are any objects with prefix
    const folder = key.split('/').slice(0, -1).join('/');
    const list = await s3.send(new ListObjectsV2Command({
      Bucket: S3_BUCKET,
      Prefix: folder,
    }));
    console.log('Files in folder', folder, ':', list.Contents?.map(c => c.Key));
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
