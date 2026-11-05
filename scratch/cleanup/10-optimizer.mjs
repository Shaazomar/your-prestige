import { PrismaClient } from '@prisma/client';
const p=new PrismaClient(); const B='http://localhost:3111';
const BASE=process.env.NEXT_PUBLIC_S3_BUCKET_URL.replace(/\/+$/,'');
const res=r=>{const v=r?.trim(); if(!v) return null; if(/^https?:/i.test(v)) return v; return BASE+'/'+v.replace(/^\/+/,'').split('/').map(encodeURIComponent).join('/')};
const brands=await p.brand.findMany({select:{id:true,name:true},where:{name:{in:['Jaquar','Artize','Essco','Motto','Velzone','Lonix']}}});
for(const b of brands){
  const rows=await p.$queryRawUnsafe(`SELECT slug,"lifestyleImage" l FROM "Product" WHERE "brandId"=$1 AND "lifestyleImage" IS NOT NULL AND status='ACTIVE' ORDER BY random() LIMIT 25`,b.id);
  const out={};
  await Promise.all(rows.map(async r=>{const u=res(r.l); const t=Date.now(); try{const x=await fetch(`${B}/_next/image?url=${encodeURIComponent(u)}&w=640&q=75`,{headers:{accept:'image/avif,image/webp,*/*'},signal:AbortSignal.timeout(60000)}); const k=x.status+' '+(x.headers.get('content-type')||''); out[k]=(out[k]||0)+1; if(x.status!==200&&!out.ex) out.ex=[u,(await x.text()).slice(0,150)];}catch(e){out['err '+e.name]=(out['err '+e.name]||0)+1}}));
  console.log(b.name,JSON.stringify(out));
}
await p.$disconnect();
