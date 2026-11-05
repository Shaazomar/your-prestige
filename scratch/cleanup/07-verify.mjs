import { PrismaClient } from '@prisma/client';
import fs from 'node:fs';
const p = new PrismaClient();
const val = JSON.parse(fs.readFileSync('scratch/cleanup/validation.json')).results;
const BASE = process.env.NEXT_PUBLIC_S3_BUCKET_URL.replace(/\/+$/,'');
const res=r=>{const v=r?.trim(); if(!v) return null; if(/^https?:/i.test(v)) return v; return BASE+'/'+v.replace(/^\/+/,'').split('/').map(encodeURIComponent).join('/')};
const arr=v=>Array.isArray(v)?v.filter(x=>typeof x==='string'&&x.trim()):[];
const pub = await p.$queryRawUnsafe(`SELECT p.id,p.name,p."lifestyleImage",p."textureImage",p."images",p."image_key",p."thumbnail_key" FROM "Product" p WHERE p."deletedAt" IS NULL AND p."published" = true AND p."status" NOT IN ('DRAFT','ARCHIVED') AND (COALESCE(p."lifestyleImage", '') != '' OR COALESCE(p."image_key", '') != '' OR COALESCE(p."thumbnail_key", '') != '' OR COALESCE(p."textureImage", '') != '' OR p."images" IS NOT NULL)`);
let bad=0; for(const r of pub){ const u=[r.lifestyleImage,arr(r.images)[0],r.image_key,r.thumbnail_key,r.textureImage].map(res).find(Boolean); if(!u||!val[u]?.ok) bad++; }
console.log('public products',pub.length,'with primary image NOT validated:',bad);
const tot=await p.product.count(); const noimg=await p.$queryRawUnsafe(`SELECT count(*)::int n, count(*) FILTER (WHERE published AND status='ACTIVE' AND "deletedAt" IS NULL)::int visible FROM "Product" WHERE COALESCE("lifestyleImage",'')='' AND COALESCE("textureImage",'')='' AND COALESCE(image_key,'')='' AND COALESCE(thumbnail_key,'')='' AND (images IS NULL OR images::text IN ('[]','null'))`);
console.log('total products now',tot,'imageless remaining',noimg[0]);
const cats=await p.$queryRawUnsafe(`SELECT count(*)::int n FROM "Product" WHERE ("brandId" IS NOT NULL AND "brandId" NOT IN (SELECT id FROM "Brand")) OR ("categoryId" IS NOT NULL AND "categoryId" NOT IN (SELECT id FROM "Category"))`); console.log('dangling brand/category refs',cats[0].n);
await p.$disconnect();
