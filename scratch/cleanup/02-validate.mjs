// READ-ONLY. Validates every image reference on every Product (+variants). Writes results JSON.
import { PrismaClient } from '@prisma/client';
import { S3Client, HeadObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import fs from 'node:fs';
const OUT = 'scratch/cleanup/validation.json';
const p = new PrismaClient();
const s3 = new S3Client({ region: process.env.AWS_REGION });
const BUCKET = process.env.AWS_S3_BUCKET;
const BASE = process.env.NEXT_PUBLIC_S3_BUCKET_URL.replace(/\/+$/,'');
const arr=v=>Array.isArray(v)?v.filter(x=>typeof x==='string'&&x.trim()):[];
const res=r=>{const v=r?.trim(); if(!v) return null; if(/^https?:\/\//i.test(v)) return v; if(v.startsWith('//')) return 'https:'+v; if(v.startsWith('/')) return 'REL:'+v; return BASE+'/'+v.replace(/^\/+/,'').split('/').map(encodeURIComponent).join('/')};

const products = await p.product.findMany({ select:{id:true,slug:true,name:true,lifestyleImage:true,textureImage:true,images:true,image_key:true,thumbnail_key:true,brand:{select:{name:true}}}});
let variants=[]; try{ variants = await p.$queryRawUnsafe(`SELECT "productId", image FROM "ProductVariant" WHERE image IS NOT NULL AND image<>''`);}catch{ console.log('no ProductVariant table'); }

const urls = new Set();
for(const r of products){ for(const v of [r.lifestyleImage,...arr(r.images),r.image_key,r.thumbnail_key,r.textureImage]){const u=res(v); if(u) urls.add(u);} }
for(const v of variants){const u=res(v.image); if(u) urls.add(u);}
console.log('products',products.length,'unique urls',urls.size);

const results = {};
async function check(u){
  if(u.startsWith('REL:')) return {ok:false,reason:'relative-path-unverifiable'};
  let last;
  for(let a=0;a<3;a++){
    try{
      const ac=new AbortController(); const t=setTimeout(()=>ac.abort(),30000);
      const r=await fetch(u,{signal:ac.signal}); 
      if(!r.ok){clearTimeout(t); if(r.status>=500||r.status===429){last={ok:false,reason:'http-'+r.status,transient:true};await new Promise(s=>setTimeout(s,1000*(a+1)));continue;} return {ok:false,reason:'http-'+r.status};}
      const ct=r.headers.get('content-type')||''; const buf=Buffer.from(await r.arrayBuffer()); clearTimeout(t);
      if(buf.length<200) return {ok:false,reason:'tiny-file-'+buf.length,ct};
      if(!/^image\//i.test(ct)) return {ok:false,reason:'bad-content-type:'+ct};
      try{ const m=await sharp(buf,{failOn:'error'}).metadata(); await sharp(buf,{failOn:'error'}).resize(64).raw().toBuffer(); // full decode
        if(!m.width||!m.height||m.width<50||m.height<50) return {ok:false,reason:`too-small-${m.width}x${m.height}`};
        return {ok:true,fmt:m.format,w:m.width,h:m.height,bytes:buf.length}; }
      catch(e){ return {ok:false,reason:'decode-failed:'+String(e.message).slice(0,80)}; }
    }catch(e){ last={ok:false,reason:'network:'+(e.name||e.message),transient:true}; await new Promise(s=>setTimeout(s,1000*(a+1))); }
  }
  return last;
}
// S3 key existence check for URLs on our bucket (only for failures, to classify)
async function s3Exists(u){
  if(!u.startsWith(BASE+'/')) return null;
  const key=decodeURIComponent(u.slice(BASE.length+1));
  try{ await s3.send(new HeadObjectCommand({Bucket:BUCKET,Key:key})); return true;}catch(e){ return e.$metadata?.httpStatusCode===404?false:null; }
}
const list=[...urls]; let i=0,done=0;
async function worker(){ while(i<list.length){ const u=list[i++]; const r=await check(u); if(!r.ok){ r.s3Exists=await s3Exists(u);} results[u]=r; if(++done%500===0) console.log('checked',done,'/',list.length); } }
await Promise.all(Array.from({length:24},worker));
fs.writeFileSync(OUT,JSON.stringify({generatedAt:new Date().toISOString(),results},null,0));
const bad=Object.values(results).filter(r=>!r.ok); const reasons={}; bad.forEach(b=>{const k=b.reason.split(':')[0];reasons[k]=(reasons[k]||0)+1});
console.log('DONE ok',list.length-bad.length,'bad',bad.length,reasons,'transient-bad',bad.filter(b=>b.transient).length);
await p.$disconnect();
