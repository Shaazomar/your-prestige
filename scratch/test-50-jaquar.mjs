import { PrismaClient } from '@prisma/client';
import { S3Client, HeadObjectCommand } from '@aws-sdk/client-s3';

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
  const products = await prisma.product.findMany({
    where: { brand: { name: 'Jaquar' } },
    take: 50,
    select: { id: true, name: true, lifestyleImage: true }
  });

  let valid = 0;
  let broken = 0;
  for (const p of products) {
    const key = extractS3Key(p.lifestyleImage);
    try {
      const head = await s3.send(new HeadObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
      }));
      valid++;
    } catch (e) {
      console.log('Failed for product', p.name, 'Key:', key, 'Error:', e.name, e.message);
      broken++;
    }
  }

  console.log(`Tested 50 Jaquar products: Valid = ${valid}, Broken = ${broken}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
