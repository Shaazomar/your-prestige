import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
const fks = await p.$queryRawUnsafe(`
 SELECT c.conrelid::regclass::text AS tbl, c.conname, pg_get_constraintdef(c.oid) AS def
 FROM pg_constraint c WHERE c.contype='f' AND c.confrelid='"Product"'::regclass ORDER BY 1`);
console.log(fks);
const tot = await p.product.count();
const by = await p.$queryRawUnsafe(`SELECT status, published, ("deletedAt" IS NOT NULL) del, count(*)::int n FROM "Product" GROUP BY 1,2,3`);
console.log({tot}, by);
const inv = await p.$queryRawUnsafe(`SELECT count(*)::int n, count(*) FILTER (WHERE true) FROM "Inventory"`);
console.log('inventory rows', inv);
await p.$disconnect();
