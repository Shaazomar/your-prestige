import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
const brands = await p.brand.findMany({ select: { id: true, slug: true, name: true, published: true }, orderBy: { name: 'asc' } });
console.log('BRANDS', JSON.stringify(brands, null, 2));
const categories = await p.category.findMany({ select: { id: true, slug: true, name: true, parentId: true } });
console.log('CATEGORIES', JSON.stringify(categories, null, 2));
const collections = await p.collection.findMany({ select: { id: true, slug: true, name: true } });
console.log('COLLECTIONS', JSON.stringify(collections, null, 2));
await p.$disconnect();
