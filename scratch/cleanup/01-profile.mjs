import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
const rows = await p.product.findMany({ select:{id:true,slug:true,name:true,lifestyleImage:true,textureImage:true,images:true,image_key:true,thumbnail_key:true,sourceWebsite:true,sourceImageUrl:true,brand:{select:{name:true}}}});
const arr=v=>Array.isArray(v)?v.filter(x=>typeof x==='string'&&x.trim()):[];
const base=process.env.NEXT_PUBLIC_S3_BUCKET_URL;
console.log('base host', base && new URL(base).host);
const hosts={}, cnt={none:0}; const urlUse=new Map();
const res=r=>{const v=r?.trim(); if(!v) return null; if(/^https?:|^\/\//.test(v)||v.startsWith('/')) return v; return base+'/'+v.split('/').map(encodeURIComponent).join('/')};
let kinds={};
for(const r of rows){
  const chain=[r.lifestyleImage,arr(r.images)[0],r.image_key,r.thumbnail_key,r.textureImage].map(res).filter(Boolean);
  if(!chain.length){cnt.none++;continue}
  const u=chain[0]; let h; try{h=u.startsWith('/')?'(relative)':new URL(u).host}catch{h='(invalid)'}
  hosts[h]=(hosts[h]||0)+1;
  const k=[!!r.lifestyleImage,arr(r.images).length>0,!!r.image_key,!!r.thumbnail_key,!!r.textureImage].map(x=>x?1:0).join('');
  kinds[k]=(kinds[k]||0)+1;
  if(!urlUse.has(u)) urlUse.set(u,[]); urlUse.get(u).push(r.name);
}
console.log(cnt,hosts); console.log('fields present [lifestyle,images,key,thumb,texture]',kinds);
console.log('distinct primary urls',urlUse.size);
const shared=[...urlUse].filter(([,v])=>v.length>1).sort((a,b)=>b[1].length-a[1].length);
console.log('urls shared by >1 product',shared.length); for(const [u,v] of shared.slice(0,12)) console.log(v.length,u,'|',v.slice(0,3).join(' / '));
const bb={}; for(const r of rows){const b=r.brand?.name??'(none)'; bb[b]=(bb[b]||0)+1} console.log(bb);
await p.$disconnect();
