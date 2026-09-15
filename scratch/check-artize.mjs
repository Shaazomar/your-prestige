import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
const rows = await p.product.findMany({
  where: { sourceWebsite: 'artize' },
  select: { name: true, slug: true, sku: true, collection: true, finish: true, lifestyleImage: true, images: true, sourceProductUrl: true, categoryId: true, brandId: true, description: true },
});
console.log(JSON.stringify(rows, null, 2));
await p.$disconnect();
