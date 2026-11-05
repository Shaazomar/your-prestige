import { PrismaClient } from '@prisma/client';
const p=new PrismaClient();
const rows=await p.product.findMany({where:{brand:{name:'Artize'},OR:[{name:{contains:'FLO2 Single Lever Pulldown',mode:'insensitive'}},{name:{contains:'Central Hole Basin Mixer',mode:'insensitive'}},{name:{contains:'BASIN-MIXER',mode:'insensitive'}},{slug:{contains:'basin-mixer',mode:'insensitive'}},{productCode:{in:['BASIN-MIXER-71011B','BASIN-MIXER','BASIN-MIXER-75011B']}}]},select:{id:true,slug:true,name:true,productCode:true,lifestyleImage:true,images:true,category:{select:{slug:true}},status:true,published:true},take:12});
for(const r of rows){ const u=r.lifestyleImage; const h=u&&await fetch(u,{method:'HEAD'}); console.log(r.name,'|',r.productCode,'|',r.slug,'\n   img:',u?.split('/prestige/')[1],'| S3',h?.status,h?.headers.get('content-type'),h?.headers.get('content-length'),'| gallery',Array.isArray(r.images)?r.images.length:0)}
console.log(rows.length,'found'); await p.$disconnect();
