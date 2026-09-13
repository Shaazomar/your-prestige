import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

console.log('=== ALL BRANDS ===');
const brands = await p.brand.findMany({
  where: { deletedAt: null },
  select: { slug: true, name: true, published: true, _count: { select: { products: true } } },
  orderBy: { name: 'asc' },
});
console.log(brands.map(b => `${b.slug.padEnd(20)} name=${b.name.padEnd(20)} published=${b.published} products=${b._count.products}`).join('\n'));
console.log('Total brands:', brands.length);

console.log('\n=== ALL CATEGORIES (tree) ===');
const cats = await p.category.findMany({
  where: { deletedAt: null },
  select: { slug: true, name: true, parentId: true, published: true, _count: { select: { products: true } } },
  orderBy: { name: 'asc' },
});
console.log(cats.map(c => `${c.slug.padEnd(25)} name=${c.name.padEnd(20)} parentId=${c.parentId ?? '-'} products=${c._count.products}`).join('\n'));
console.log('Total categories:', cats.length);

console.log('\n=== ALL COLLECTIONS ===');
const cols = await p.collection.count();
const colsSample = await p.collection.findMany({ take: 10, select: { slug: true, name: true, _count: { select: { products: true } } } });
console.log('Total collections:', cols, colsSample);

console.log('\n=== Product field population (imported rows) ===');
const totalImported = await p.product.count({ where: { sourceWebsite: { not: null } } });
const withCollectionString = await p.product.count({ where: { sourceWebsite: { not: null }, collection: { not: null } } });
const withCollectionId = await p.product.count({ where: { sourceWebsite: { not: null }, collectionId: { not: null } } });
const withSpecs = await p.product.count({ where: { sourceWebsite: { not: null }, specifications: { not: null } } });
console.log({ totalImported, withCollectionString, withCollectionId, withSpecs });

console.log('\n=== Sample product names per brand (to see naming/category signal) ===');
for (const slug of ['jaquar', 'artize', 'essco', 'motto', 'velzone', 'lonix']) {
  const samples = await p.product.findMany({
    where: { brand: { slug } },
    select: { name: true, collection: true, category: { select: { slug: true } }, productCode: true },
    take: 5,
  });
  console.log(`--- ${slug} ---`);
  console.log(samples);
}

await p.$disconnect();
