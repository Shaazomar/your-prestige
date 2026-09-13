import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

for (const slug of ['motto', 'velzone', 'lonix']) {
  console.log(`\n=== ${slug} sample rows (all descriptive fields) ===`);
  const rows = await p.product.findMany({
    where: { brand: { slug } },
    select: {
      name: true, collection: true, size: true, sizes: true, finish: true,
      surface: true, material: true, texture: true, thickness: true,
      productCode: true, sku: true, applicationTags: true, searchKeywords: true,
      sourceProductUrl: true,
    },
    take: 8,
  });
  console.log(JSON.stringify(rows, null, 1));

  console.log(`--- distinct size values (${slug}) ---`);
  const sizes = await p.product.groupBy({ by: ['size'], where: { brand: { slug } }, _count: { _all: true }, orderBy: { _count: { size: 'desc' } } });
  console.log(sizes.slice(0, 20).map(s => `${String(s.size).padEnd(20)} ${s._count._all}`).join('\n'));

  console.log(`--- distinct surface values (${slug}) ---`);
  const surf = await p.product.groupBy({ by: ['surface'], where: { brand: { slug } }, _count: { _all: true }, orderBy: { _count: { surface: 'desc' } } });
  console.log(surf.slice(0, 20).map(s => `${String(s.surface).padEnd(20)} ${s._count._all}`).join('\n'));
}

await p.$disconnect();
