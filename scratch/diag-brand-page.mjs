import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

async function time(label, fn) {
  const start = Date.now();
  try {
    const result = await fn();
    console.log(`${label}: ${Date.now() - start}ms`, Array.isArray(result) ? `(${result.length} rows)` : '');
  } catch (e) {
    console.log(`${label}: ERRORED after ${Date.now() - start}ms —`, e.message);
  }
}

await time('brand.findFirst (getBrandBySlug base)', () =>
  p.brand.findFirst({ where: { slug: 'jaquar', published: true, deletedAt: null } })
);

await time('distinct categoryId (getBrandBySlug categoryCount)', async () => {
  const b = await p.brand.findFirst({ where: { slug: 'jaquar' } });
  return p.product.findMany({
    where: { brandId: b.id, published: true, deletedAt: null, categoryId: { not: null } },
    distinct: ['categoryId'],
    select: { categoryId: true },
  });
});

await time('getBrandCategories groupBy', () =>
  p.product.groupBy({ by: ['categoryId'], where: { published: true, deletedAt: null, brand: { slug: 'jaquar' } }, _count: { _all: true } })
);

await time('getBrandCollections groupBy', () =>
  p.product.groupBy({ by: ['collection'], where: { published: true, deletedAt: null, brand: { slug: 'jaquar' } }, _count: { _all: true } })
);

await time('getBrandFeaturedCollections (Collection by brand relation)', () =>
  p.collection.findMany({ where: { brand: { slug: 'jaquar' }, published: true, deletedAt: null } })
);

await time('getBrandFeaturedProducts fallback query', async () => {
  const brand = await p.brand.findFirst({ where: { slug: 'jaquar' } });
  return p.product.findMany({
    where: { brandId: brand.id, published: true, deletedAt: null },
    include: { category: { select: { slug: true, name: true, parent: { select: { slug: true } } } }, brand: { select: { name: true } } },
    orderBy: [{ featured: 'desc' }, { viewCount: 'desc' }, { createdAt: 'desc' }],
    take: 8,
  });
});

await time('searchCatalog-equivalent product.findMany', () =>
  p.product.findMany({
    where: { AND: [{ published: true, deletedAt: null }, { brand: { name: { equals: 'Jaquar', mode: 'insensitive' } } }] },
    include: { category: { select: { slug: true, name: true, parent: { select: { slug: true } } } }, brand: { select: { name: true } } },
    take: 24,
  })
);

await p.$disconnect();
console.log('done');
