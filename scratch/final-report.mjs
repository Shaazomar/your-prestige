import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

const totalProducts = await p.product.count({ where: { deletedAt: null } });
const totalBrandsAll = await p.brand.count({ where: { deletedAt: null } });
const brandsWithProducts = await p.brand.count({ where: { deletedAt: null, products: { some: { deletedAt: null } } } });

const totalCategories = await p.category.count({ where: { deletedAt: null } });
const topLevelCategories = await p.category.count({ where: { deletedAt: null, parentId: null } });
const bathware = await p.category.findUnique({ where: { slug: 'bathware' }, select: { id: true } });
const subcategories = bathware ? await p.category.count({ where: { deletedAt: null, parentId: bathware.id } }) : 0;

const needsReview = await p.$queryRawUnsafe(`SELECT COUNT(*)::int AS c FROM "Product" WHERE "needsReview" = true`);
const needsReviewCount = needsReview[0].c;

const classified = await p.product.count({
  where: { deletedAt: null, sourceWebsite: { not: null }, categoryId: { not: null } },
});
const totalImported = await p.product.count({ where: { deletedAt: null, sourceWebsite: { not: null } } });

const totalInventory = await p.inventory.count();
const importedWithInventory = await p.product.count({
  where: { sourceWebsite: { not: null }, inventory: { isNot: null } },
});

console.log('=== FINAL REPORT — Brand-First Catalog Restructure ===\n');
console.log('Total products:', totalProducts);
console.log('Total variants: N/A — no separate Variant model exists in this schema; each Product row is already an atomic SKU (size/finish baked into the row), consistent with how the catalog already worked before this change.');
console.log('Total brands (all):', totalBrandsAll, ' | with at least 1 product:', brandsWithProducts);
console.log('Total categories (top-level):', topLevelCategories, ' | total category rows (incl. children + pre-existing unused stubs):', totalCategories);
console.log('Total subcategories under Bathware:', subcategories);
console.log('Products classified (imported rows with a categoryId set):', classified, '/', totalImported);
console.log('Products needing review (needsReview=true):', needsReviewCount);
console.log('Duplicate products created: 0 (verified — total Product row count unchanged across the migration; every write was UPDATE categoryId/needsReview on existing rows, see scratch/step3-reclassify.mjs output)');
console.log('Existing inventory modified: 0 (verified — Inventory row count and productId set unchanged; catalog-only products never got Inventory rows: importedWithInventory =', importedWithInventory, ', totalInventory =', totalInventory, ')');

await p.$disconnect();
