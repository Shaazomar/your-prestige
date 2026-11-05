import { PrismaClient } from '@prisma/client';
import fs from 'node:fs';
const p = new PrismaClient();
const val = JSON.parse(fs.readFileSync('scratch/cleanup/validation.json')).results;
const BASE = process.env.NEXT_PUBLIC_S3_BUCKET_URL.replace(/\/+$/,'');
const arr=v=>Array.isArray(v)?v.filter(x=>typeof x==='string'&&x.trim()):[];
const res=r=>{const v=r?.trim(); if(!v) return null; if(/^https?:\/\//i.test(v)) return v; return BASE+'/'+v.replace(/^\/+/,'').split('/').map(encodeURIComponent).join('/')};
const rows = await p.product.findMany({ select:{id:true,slug:true,name:true,status:true,published:true,deletedAt:true,sourceWebsite:true,lifestyleImage:true,textureImage:true,images:true,image_key:true,thumbnail_key:true,brand:{select:{name:true}},category:{select:{name:true}},inventory:{select:{id:true}}}});
const noImg=[], brandMismatch=[], lowOverlap=[];
const tok=s=>new Set(s.toLowerCase().replace(/[^a-z0-9]+/g,' ').split(' ').filter(t=>t.length>2));
for(const r of rows){
  const chain=[r.lifestyleImage,arr(r.images)[0],r.image_key,r.thumbnail_key,r.textureImage].map(res).filter(Boolean);
  if(!chain.length){noImg.push(r);continue}
  const u=chain[0]; const m=u.match(/\/catalog\/([^/]+)\/([^/]+)\//);
  if(m){ const bf=m[1], b=(r.brand?.name||'').toLowerCase();
    if(b && bf!==b) brandMismatch.push({name:r.name,brand:r.brand.name,folder:bf,u});
    const a=tok(m[2].replace(/-/g,' ')), n=tok(r.name+' '+r.slug); const inter=[...a].filter(t=>n.has(t)).length;
    if(a.size && inter===0) lowOverlap.push({name:r.name,slug:r.slug,keySlug:m[2],brand:r.brand?.name});
  }
}
console.log('no image',noImg.length,'| with inventory',noImg.filter(r=>r.inventory).length);
console.log('brand/folder mismatch',brandMismatch.length, brandMismatch.slice(0,10));
console.log('zero token overlap name vs image folder',lowOverlap.length, lowOverlap.slice(0,25));
console.log('no-image by brand',noImg.reduce((a,r)=>(a[r.brand?.name]=(a[r.brand?.name]||0)+1,a),{}));
console.log('no-image sample',noImg.slice(0,8).map(r=>[r.name,r.status,r.sourceWebsite,!!r.inventory]));
fs.writeFileSync('scratch/cleanup/noimage.json',JSON.stringify(noImg.map(r=>({id:r.id,slug:r.slug,name:r.name,brand:r.brand?.name,hasInventory:!!r.inventory})),null,1));
const soft=rows.filter(r=>r.deletedAt); console.log('soft-deleted',soft.map(r=>[r.name,r.slug]));
await p.$disconnect();
