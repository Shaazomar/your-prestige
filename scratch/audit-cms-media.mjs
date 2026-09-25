import { PrismaClient } from '@prisma/client';
import { S3Client, HeadObjectCommand } from '@aws-sdk/client-s3';

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
    return decodeURIComponent(u.pathname.replace(/^\/+/, ''));
  } catch {
    return null;
  }
}

async function verifyMedia(urlOrKey) {
  if (!urlOrKey) return { status: 'missing' };
  const resolved = resolveImageRef(urlOrKey);
  const s3Key = extractS3Key(urlOrKey);

  if (s3Key && (urlOrKey.includes('amazonaws.com') || !urlOrKey.startsWith('http'))) {
    try {
      const head = await s3.send(new HeadObjectCommand({
        Bucket: S3_BUCKET,
        Key: s3Key,
      }));
      if (!head.ContentLength) return { status: 'empty', reason: 'zero_bytes' };
      return { status: 'valid', size: head.ContentLength, contentType: head.ContentType };
    } catch (e) {
      return { status: 'broken', error: e.name || e.message };
    }
  }

  if (resolved?.startsWith('http')) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 6000);
      const res = await fetch(resolved, { method: 'HEAD', signal: ctrl.signal });
      clearTimeout(t);
      if (res.ok) return { status: 'valid', httpStatus: res.status };
      return { status: 'broken', httpStatus: res.status };
    } catch (e) {
      return { status: 'broken', error: e.message };
    }
  }

  return { status: 'invalid_format' };
}

async function main() {
  console.log('--- CMS & SITE MEDIA AUDIT ---');

  // 1. Brands
  const brands = await prisma.brand.findMany({ select: { id: true, name: true, slug: true, logo: true, banner: true, mobileCoverImage: true, heroPoster: true } });
  console.log(`Auditing ${brands.length} Brands...`);
  for (const b of brands) {
    const logoCheck = await verifyMedia(b.logo);
    const bannerCheck = await verifyMedia(b.banner);
    if (logoCheck.status !== 'valid' || bannerCheck.status !== 'valid') {
      console.log(`Brand [${b.name}] (${b.slug}): Logo = ${logoCheck.status} (${b.logo}), Banner = ${bannerCheck.status} (${b.banner})`);
    }
  }

  // 2. Categories
  const categories = await prisma.category.findMany({ select: { id: true, name: true, slug: true, image: true, bannerImage: true } });
  console.log(`Auditing ${categories.length} Categories...`);
  for (const c of categories) {
    const imgCheck = await verifyMedia(c.image);
    const bannerCheck = await verifyMedia(c.bannerImage);
    if (imgCheck.status !== 'valid' || bannerCheck.status !== 'valid') {
      console.log(`Category [${c.name}] (${c.slug}): Image = ${imgCheck.status} (${c.image}), Banner = ${bannerCheck.status} (${c.bannerImage})`);
    }
  }

  // 3. Collections
  const collections = await prisma.collection.findMany({ select: { id: true, name: true, slug: true, image: true } });
  console.log(`Auditing ${collections.length} Collections...`);
  for (const col of collections) {
    const imgCheck = await verifyMedia(col.image);
    if (imgCheck.status !== 'valid') {
      console.log(`Collection [${col.name}] (${col.slug}): Image = ${imgCheck.status} (${col.image})`);
    }
  }

  // 4. Showrooms
  const showrooms = await prisma.showroom.findMany({ select: { id: true, name: true, slug: true, heroImage: true } });
  console.log(`Auditing ${showrooms.length} Showrooms...`);
  for (const s of showrooms) {
    const heroCheck = await verifyMedia(s.heroImage);
    if (heroCheck.status !== 'valid') {
      console.log(`Showroom [${s.name}] (${s.slug}): Hero = ${heroCheck.status} (${s.heroImage})`);
    }
  }

  // 5. AboutPerson
  const aboutPeople = await prisma.aboutPerson.findMany({ select: { id: true, name: true, image: true, type: true } });
  console.log(`Auditing ${aboutPeople.length} AboutPeople...`);
  for (const ap of aboutPeople) {
    const imgCheck = await verifyMedia(ap.image);
    if (imgCheck.status !== 'valid') {
      console.log(`AboutPerson [${ap.name}] (${ap.type}): Image = ${imgCheck.status} (${ap.image})`);
    }
  }

  // 6. LandingPages
  const landingPages = await prisma.landingPage.findMany({ select: { id: true, title: true, slug: true, heroImage: true } });
  console.log(`Auditing ${landingPages.length} LandingPages...`);
  for (const lp of landingPages) {
    const heroCheck = await verifyMedia(lp.heroImage);
    if (heroCheck.status !== 'valid') {
      console.log(`LandingPage [${lp.title}] (${lp.slug}): Hero = ${heroCheck.status} (${lp.heroImage})`);
    }
  }

  console.log('--- CMS AUDIT COMPLETE ---');
}

main().catch(console.error).finally(() => prisma.$disconnect());
