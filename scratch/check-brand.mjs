import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
const src = process.argv[2];
const rows = await p.product.findMany({
  where: { sourceWebsite: src },
  select: { name: true, slug: true, productCode: true, collection: true, color: true, finish: true, size: true, material: true, lifestyleImage: true, sourceProductUrl: true },
});
console.log(JSON.stringify(rows, null, 2));
await p.$disconnect();
