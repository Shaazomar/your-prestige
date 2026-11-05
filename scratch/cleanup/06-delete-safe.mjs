import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
const DEP=['Inventory','InventoryHistory','InventoryMovement','StockBlock','StockBookingItem','ShipmentItem','Seo','Offer','ProductAttributeValue','WhatsAppAnalytics','Conversation','ExtractedProduct','CustomerOrderItem'];
const invBefore=await p.$queryRawUnsafe(`SELECT count(*)::int n, coalesce(sum("quantity"),0)::text q FROM "Inventory"`).catch(()=>null);
const snap=async()=>Object.fromEntries(await Promise.all(['Inventory','InventoryMovement','StockBlock'].map(async t=>[t,(await p.$queryRawUnsafe(`SELECT count(*)::int n FROM "${t}"`))[0].n])));
const before=await snap();
const del = await p.$transaction(async tx=>{
  const cand = await tx.product.findMany({where:{OR:[{lifestyleImage:null},{lifestyleImage:''}],AND:[{OR:[{textureImage:null},{textureImage:''}]},{OR:[{image_key:null},{image_key:''}]},{OR:[{thumbnail_key:null},{thumbnail_key:''}]}]},select:{id:true,name:true,slug:true,images:true}});
  const noImg=cand.filter(c=>!(Array.isArray(c.images)&&c.images.some(x=>typeof x==='string'&&x.trim())));
  const ids=noImg.map(c=>c.id); const hasDep=new Set();
  const refs=await tx.$queryRawUnsafe(`SELECT table_name t, column_name c FROM information_schema.columns WHERE table_schema='public' AND column_name IN ('productId','product_id') AND table_name<>'Product'`);
  console.log('checked dependent tables:',refs.map(r=>r.t).join(','));
  for(const {t,c} of refs){ const r=await tx.$queryRawUnsafe(`SELECT DISTINCT "${c}" id FROM "${t}" WHERE "${c}" = ANY($1)`,ids); r.forEach(x=>hasDep.add(x.id)); }
  const safe=noImg.filter(c=>!hasDep.has(c.id));
  console.log('imageless',noImg.length,'safe-to-delete (zero dependents)',safe.length, safe.map(s=>s.name));
  for(const s of safe) await tx.product.delete({where:{id:s.id}});
  return safe;
},{timeout:60000,maxWait:15000});
const after=await snap();
console.log('deleted',del.length,'inventory-related counts before',before,'after',after, JSON.stringify(before)===JSON.stringify(after)?'UNCHANGED':'CHANGED!');
await p.$disconnect();
