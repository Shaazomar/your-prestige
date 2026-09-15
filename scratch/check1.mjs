import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
const total = await p.product.count();
const withInv = await p.product.count({ where: { inventory: { isNot: null } } });
const withoutInv = await p.product.count({ where: { inventory: { is: null } } });
console.log({ total, withInv, withoutInv });
const sample = await p.product.findMany({ take: 5, select: { id: true, name: true, sku: true, size: true, sizes: true, images: true, collection: true, collectionId: true, brandId: true, categoryId: true, importKey: true, sourceSheet: true } });
console.log(JSON.stringify(sample, null, 2));
await p.$disconnect();
