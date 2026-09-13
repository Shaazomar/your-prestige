// Shared utilities for the one-time brand-catalog scrape/import.
// Run with: node --env-file=.env scratch/scrape-<brand>.mjs
import { PrismaClient } from '@prisma/client';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'node:crypto';

export const prisma = new PrismaClient();

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

export function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

/** Small concurrency pool — runs `worker` over `items`, `limit` at a time. */
export async function pool(items, limit, worker) {
  let i = 0;
  const results = new Array(items.length);
  async function run() {
    while (i < items.length) {
      const idx = i++;
      try {
        results[idx] = await worker(items[idx], idx);
      } catch (e) {
        results[idx] = { __error: e };
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return results;
}

export async function fetchText(url, { retries = 3, timeoutMs = 20000 } = {}) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: ctrl.signal, redirect: 'follow' });
      clearTimeout(t);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (e) {
      lastErr = e;
      clearTimeout(t);
      if (attempt < retries) await sleep(400 * (attempt + 1));
    }
  }
  throw lastErr;
}

export async function fetchBuffer(url, { retries = 3, timeoutMs = 25000 } = {}) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: ctrl.signal, redirect: 'follow' });
      clearTimeout(t);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const contentType = res.headers.get('content-type') || 'image/jpeg';
      const buf = Buffer.from(await res.arrayBuffer());
      return { buf, contentType };
    } catch (e) {
      lastErr = e;
      clearTimeout(t);
      if (attempt < retries) await sleep(400 * (attempt + 1));
    }
  }
  throw lastErr;
}

// --- S3 upload (mirrors src/lib/s3.ts's uploadBufferToS3, standalone so this
// script doesn't need the Next.js path-alias/module resolution context) ---
function s3Config() {
  const bucket = process.env.S3_BUCKET || process.env.AWS_S3_BUCKET || 'your-prestige-in';
  const region = process.env.S3_REGION || process.env.AWS_REGION || 'ap-south-1';
  const baseUrl = (process.env.NEXT_PUBLIC_S3_BUCKET_URL || `https://${bucket}.s3.${region}.amazonaws.com`).replace(/\/$/, '');
  return { bucket, region, baseUrl };
}
let _s3;
function s3Client() {
  if (_s3) return _s3;
  const { region } = s3Config();
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY?.trim();
  _s3 = new S3Client({ region, credentials: { accessKeyId, secretAccessKey } });
  return _s3;
}

const uploadedCache = new Map(); // sourceUrl -> hosted url (avoid re-uploading the same image twice)

/** Downloads a source image and re-hosts it on Prestige's own S3 bucket. */
export async function rehostImage(sourceUrl, folder, filenameHint) {
  if (!sourceUrl) return null;
  if (uploadedCache.has(sourceUrl)) return uploadedCache.get(sourceUrl);
  const { buf, contentType } = await fetchBuffer(sourceUrl);
  if (!contentType.startsWith('image/')) throw new Error(`Not an image: ${contentType}`);
  const ext = (contentType.split('/')[1] || 'jpg').replace('jpeg', 'jpg').split(';')[0];
  const clean = (filenameHint || crypto.randomUUID()).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
  const key = `prestige/catalog/${folder}/${Date.now()}-${clean}.${ext}`;
  const { bucket, baseUrl } = s3Config();
  await s3Client().send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: buf, ContentType: contentType }));
  const url = `${baseUrl}/${key}`;
  uploadedCache.set(sourceUrl, url);
  return url;
}

export function slugify(s) {
  return String(s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 90);
}

export function titleCase(s) {
  return String(s || '').toLowerCase().replace(/(^|\s|-)\w/g, (m) => m.toUpperCase());
}

/** Extracts the value of the FIRST or LAST matching <meta property="og:X"> tag. */
export function ogTags(html) {
  const tags = {};
  for (const m of html.matchAll(/<meta[^>]*property=["']og:([a-zA-Z:]+)["'][^>]*content=["']([^"']*)["'][^>]*>/g)) {
    tags[m[1]] = m[2]; // last occurrence wins — later meta tags override page-level defaults on these sites
  }
  return tags;
}

export function metaDescription(html) {
  const m = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i);
  return m ? m[1] : null;
}

export function firstMatch(html, re) {
  const m = html.match(re);
  return m ? m[1].trim() : null;
}

/** Retries a Prisma call once or twice on the Neon pooler's transient "timed
 * out fetching a new connection" error, rather than failing the whole item. */
export async function withDbRetry(fn, retries = 3) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      if (attempt < retries) await sleep(500 * (attempt + 1));
    }
  }
  throw lastErr;
}

/** Ensures a globally-unique Product.slug, appending a short suffix on collision. */
const knownSlugs = new Set();
export async function uniqueSlug(base) {
  let slug = slugify(base) || crypto.randomUUID().slice(0, 8);
  if (!knownSlugs.has(slug)) {
    const existing = await withDbRetry(() => prisma.product.findUnique({ where: { slug }, select: { id: true, importKey: true } }));
    if (!existing) { knownSlugs.add(slug); return slug; }
  }
  const suffix = crypto.createHash('md5').update(base).digest('hex').slice(0, 6);
  slug = `${slug}-${suffix}`;
  knownSlugs.add(slug);
  return slug;
}

export function decodeHtml(s) {
  if (!s) return s;
  return s
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
    .trim();
}

export class Stats {
  constructor(brand) {
    this.brand = brand;
    this.discovered = 0;
    this.processed = 0;
    this.imported = 0;
    this.updated = 0;
    this.variants = 0;
    this.images = 0;
    this.noImage = 0;
    this.duplicates = 0;
    this.failed = [];
  }
  fail(url, reason) { this.failed.push({ url, reason: String(reason).slice(0, 300) }); }
  report() {
    return {
      brand: this.brand,
      discovered: this.discovered,
      processed: this.processed,
      imported: this.imported,
      updated: this.updated,
      variants: this.variants,
      images: this.images,
      noImage: this.noImage,
      duplicates: this.duplicates,
      failedCount: this.failed.length,
      failed: this.failed,
    };
  }
}

export async function upsertProduct({ importKey, data }) {
  const existing = await prisma.product.findUnique({ where: { importKey }, select: { id: true } });
  const row = await prisma.product.upsert({
    where: { importKey },
    create: { importKey, ...data },
    update: { ...data },
  });
  return { row, created: !existing };
}
