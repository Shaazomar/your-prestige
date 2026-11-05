import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
const tabs = await p.$queryRawUnsafe(`SELECT table_name, column_name FROM information_schema.columns WHERE table_schema='public' AND column_name IN ('productId','product_id') ORDER BY 1`);
const ids = (await p.product.findMany({where:{status:'DRAFT'},select:{id:true}})).map(x=>x.id);
console.log('draft ids',ids.length);
for(const t of tabs){
  const n = await p.$queryRawUnsafe(`SELECT count(*)::int n, count(*) FILTER (WHERE "${t.column_name}" = ANY($1))::int draft FROM "${t.table_name}"`, ids);
  console.log(t.table_name, n[0]);
}
await p.$disconnect();
