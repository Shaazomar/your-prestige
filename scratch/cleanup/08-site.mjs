import { PrismaClient } from '@prisma/client';
import fs from 'node:fs';
const p=new PrismaClient(); const B='http://localhost:3111';
const drafts=await p.product.findMany({where:{status:'DRAFT'},select:{slug:true,name:true,id:true}});
const deleted=['excel','walnut'];
const brands=await p.brand.findMany({where:{deletedAt:null},select:{slug:true},take:12});
const cats=await p.category.findMany({where:{deletedAt:null},select:{slug:true},take:12}).catch(async()=>p.category.findMany({select:{slug:true},take:12}));
const sample=await p.product.findMany({where:{published:true,status:'ACTIVE',deletedAt:null},select:{slug:true,category:{select:{slug:true}},brand:{select:{slug:true}}},take:6,orderBy:{viewCount:'desc'}});
const pages=['/','/products','/brands','/search?q=tile','/search?q=onyx'];
brands.forEach(b=>pages.push('/brands/'+b.slug)); cats.forEach(c=>pages.push('/products/'+c.slug));
sample.forEach(s=>s.category&&pages.push(`/products/${s.category.slug}/${s.slug}`));
// draft direct URLs must 404
const leaks=[]; const rows=[];
for(const u of [...new Set(pages)]){
  for(const ua of ['desktop','mobile']){
    const r=await fetch(B+u,{headers:{'user-agent':ua==='mobile'?'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148':'Mozilla/5.0 Chrome/120'}}); const h=await r.text();
    const hit=drafts.filter(d=>h.includes(d.slug)||h.includes(JSON.stringify(d.name).slice(1,-1)+'<')).map(d=>d.slug);
    const imgs=(h.match(/<img /g)||[]).length; const vp=/name="viewport"/.test(h);
    rows.push([ua,u,r.status,h.length,'img',imgs,'viewport',vp,'draftHits',hit.length]); if(hit.length) leaks.push([u,ua,hit.slice(0,3)]);
  }
}
rows.forEach(r=>console.log(r.join(' ')));
console.log('LEAKS',JSON.stringify(leaks));
let direct=0,non404=[]; for(const d of drafts){ const r=await fetch(`${B}/products/tiles/${d.slug}`,{redirect:'manual'}); direct++; if(r.status===200) non404.push(d.slug);} console.log('draft direct urls checked',direct,'returning 200:',non404.length);
for(const s of deleted){const r=await fetch(`${B}/products/tiles/${s}`); console.log('deleted',s,r.status)}
await p.$disconnect();
