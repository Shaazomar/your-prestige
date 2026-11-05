import { PrismaClient } from '@prisma/client';
const p=new PrismaClient(); const B='http://localhost:3111';
const drafts=await p.product.findMany({where:{status:'DRAFT'},select:{slug:true,name:true}});
const urls=['/catalogue','/catalogue?q=onyx','/catalogue?q=glossy','/catalogue?q=velzone','/catalogue?q=lonix','/catalogue?q=bianco&sort=newest','/tiles','/tiles?q=beige','/bathware','/brands/velzone','/brands/lonix','/brands/jaquar','/collections','/compare','/wishlist'];
const ua={desktop:'Mozilla/5.0 Chrome/120',mobile:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile/15E148'};
for(const u of urls) for(const [k,v] of Object.entries(ua)){ const r=await fetch(B+u,{headers:{'user-agent':v}}); const h=await r.text(); const hit=drafts.filter(d=>h.includes(d.slug)).length+drafts.filter(d=>h.includes('>'+d.name+'<')).length; console.log(k,u,r.status,'img',(h.match(/<img /g)||[]).length,'draftHits',hit); }
const r=await fetch(B+'/api/catalog?q=onyx').catch(()=>null); console.log('api',r?.status);
await p.$disconnect();
