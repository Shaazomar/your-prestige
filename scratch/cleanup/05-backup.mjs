import { PrismaClient } from '@prisma/client';
import fs from 'node:fs';
const p = new PrismaClient();
const dir='scratch/cleanup/backup-'+new Date().toISOString().slice(0,10); fs.mkdirSync(dir,{recursive:true});
const tabs=['Product','Inventory','InventoryHistory','InventoryMovement','StockBlock','StockBookingItem','ShipmentItem','Seo','Offer','ProductAttributeValue','WhatsAppAnalytics','Conversation','ExtractedProduct','Brand','Category','Collection'];
const ser=(k,v)=>typeof v==='bigint'?v.toString():v;
for(const t of tabs){ const rows=await p.$queryRawUnsafe(`SELECT * FROM "${t}"`); fs.writeFileSync(`${dir}/${t}.json`,JSON.stringify(rows,ser)); console.log(t,rows.length); }
await p.$disconnect();
