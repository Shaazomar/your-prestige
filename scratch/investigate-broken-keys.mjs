import { PrismaClient } from '@prisma/client';
import { S3Client, ListObjectsV2Command, HeadObjectCommand } from '@aws-sdk/client-s3';

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
  // Let's sample 10 Jaquar products
  const jaquar = await prisma.product.findMany({
    where: { brand: { name: 'Jaquar' } },
    take: 10,
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

  console.log('--- JAQUAR SAMPLES ---');
  console.log(JSON.stringify(jaquar, null, 2));

  // Let's sample 5 Essco broken products
  const essco = await prisma.product.findMany({
    where: { brand: { name: 'Essco' } },
    take: 5,
    select: {
      id: true,
      name: true,
      sku: true,
      lifestyleImage: true,
      sourceProductUrl: true,
      sourceImageUrl: true,
    }
  });
  console.log('--- ESSCO SAMPLES ---');
  console.log(JSON.stringify(essco, null, 2));

  // Let's sample 5 Motto broken products
  const motto = await prisma.product.findMany({
    where: { brand: { name: 'Motto' } },
    take: 5,
    select: {
      id: true,
      name: true,
      sku: true,
      lifestyleImage: true,
      sourceProductUrl: true,
      sourceImageUrl: true,
    }
  });
  console.log('--- MOTTO SAMPLES ---');
  console.log(JSON.stringify(motto, null, 2));

  // Let's check what objects exist in S3 under `prestige/`
  console.log('--- S3 BUCKET LISTING ---');
  const prefixes = ['prestige/catalog/jaquar', 'prestige/catalog/motto', 'prestige/catalog/essco', 'prestige/catalog/artize', 'prestige/catalog/velzone', 'prestige/'];
  for (const prefix of prefixes) {
    const list = await s3.send(new ListObjectsV2Command({
      Bucket: S3_BUCKET,
      Prefix: prefix,
      MaxKeys: 10,
    }));
    console.log(`Prefix: ${prefix} -> KeyCount: ${list.KeyCount}, IsTruncated: ${list.IsTruncated}`);
    if (list.Contents) {
      console.log(`Sample keys under ${prefix}:`, list.Contents.slice(0, 3).map(c => ({ Key: c.Key, Size: c.Size })));
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
