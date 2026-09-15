import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

const brands = ['artize', 'essco', 'jaquar', 'motto', 'velzone', 'lonix'];
console.log('=== Per-brand catalog counts (this import only, via sourceWebsite) ===');
for (const b of brands) {
  const count = await p.product.count({ where: { sourceWebsite: b } });
  const withImage = await p.product.count({ where: { sourceWebsite: b, lifestyleImage: { not: null } } });
  console.log(b.padEnd(10), 'products:', count, ' withImage:', withImage, ' noImage:', count - withImage);
}

console.log('\n=== Global totals ===');
const totalProducts = await p.product.count({ where: { deletedAt: null } });
const totalImported = await p.product.count({ where: { sourceWebsite: { not: null } } });
const totalInventory = await p.inventory.count();
const importedWithInventory = await p.product.count({ where: { sourceWebsite: { not: null }, inventory: { isNot: null } } });
const nullCategoryPublished = await p.product.count({ where: { deletedAt: null, published: true, categoryId: null } });
console.log({ totalProducts, totalImported, totalInventory, importedWithInventory, nullCategoryPublished });

console.log('\n=== Existing (pre-import) inventory-managed products still intact ===');
const preexistingInventoryCount = await p.inventory.count({ where: { product: { sourceWebsite: null } } });
console.log('Inventory rows on non-imported products:', preexistingInventoryCount);

console.log('\n=== Brand rows ===');
const brandRows = await p.brand.findMany({ where: { slug: { in: brands } }, select: { slug: true, name: true, _count: { select: { products: true } } } });
console.log(brandRows);

console.log('\n=== Category rows used ===');
const cats = await p.category.findMany({ where: { slug: { in: ['tiles', 'sanitary'] } }, select: { slug: true, _count: { select: { products: true } } } });
console.log(cats);

await p.$disconnect();
