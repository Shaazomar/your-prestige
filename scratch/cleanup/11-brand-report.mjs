import { PrismaClient } from '@prisma/client'; import fs from 'node:fs';
const p=new PrismaClient(); const val=JSON.parse(fs.readFileSync('scratch/cleanup/validation.json')).results;
const BASE=process.env.NEXT_PUBLIC_S3_BUCKET_URL.replace(/\/+$/,''); const arr=v=>Array.isArray(v)?v.filter(x=>typeof x==='string'&&x.trim()):[];
const res=r=>{const v=r?.trim(); if(!v) return null; if(/^https?:/i.test(v)) return v; return BASE+'/'+v.replace(/^\/+/,'').split('/').map(encodeURIComponent).join('/')};
const rows=await p.product.findMany({select:{status:true,published:true,deletedAt:true,lifestyleImage:true,textureImage:true,images:true,image_key:true,thumbnail_key:true,brand:{select:{name:true}},inventory:{select:{id:true}}}});
const out={};
for(const r of rows){const b=r.brand?.name||'(none)'; const o=out[b]??={total:0,withUrl:0,missingUrl:0,working:0,broken:0,public:0,draft:0,erpDraft:0};
 o.total++; const u=[r.lifestyleImage,arr(r.images)[0],r.image_key,r.thumbnail_key,r.textureImage].map(res).find(Boolean);
 if(!u){o.missingUrl++; if(r.inventory) o.erpDraft++;} else {o.withUrl++; val[u]?.ok?o.working++:o.broken++;}
 if(r.published&&r.status==='ACTIVE'&&!r.deletedAt) o.public++; if(r.status==='DRAFT') o.draft++;}
console.table(['Jaquar','Artize','Essco','Motto','Velzone','Lonix'].map(k=>({brand:k,...out[k]})));
await p.$disconnect();
