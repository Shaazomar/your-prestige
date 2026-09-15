import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
for (const b of ['artize','essco','jaquar','motto','velzone','lonix']) {
  console.log(b, await p.product.count({ where: { sourceWebsite: b } }));
}
console.log('total inventory rows:', await p.inventory.count());
console.log('imported-with-inventory (must be 0):', await p.product.count({ where: { sourceWebsite: { not: null }, inventory: { isNot: null } } }));
await p.$disconnect();
