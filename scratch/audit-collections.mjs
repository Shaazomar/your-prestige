import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

for (const slug of ['jaquar', 'artize', 'essco', 'motto', 'velzone', 'lonix']) {
  const rows = await p.product.groupBy({
    by: ['collection'],
    where: { brand: { slug } },
    _count: { _all: true },
    orderBy: { _count: { collection: 'desc' } },
  });
  console.log(`\n=== ${slug} — distinct "collection" values (${rows.length} distinct) ===`);
  console.log(rows.map(r => `  ${String(r.collection).padEnd(40)} ${r._count._all}`).join('\n'));
}

await p.$disconnect();
