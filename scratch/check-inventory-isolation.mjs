import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

const totalProducts = await p.product.count({ where: { deletedAt: null } });
const withInventory = await p.product.count({ where: { deletedAt: null, inventory: { isNot: null } } });
const withoutInventory = await p.product.count({ where: { deletedAt: null, inventory: { is: null } } });
const totalInventoryRows = await p.inventory.count();
const newlyImported = await p.product.count({ where: { sourceWebsite: { not: null } } });
const newlyImportedWithInventory = await p.product.count({ where: { sourceWebsite: { not: null }, inventory: { isNot: null } } });

console.log({ totalProducts, withInventory, withoutInventory, totalInventoryRows, newlyImported, newlyImportedWithInventory });

await p.$disconnect();
