import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
// Additive-only, idempotent DDL — does not touch any existing column/table.
// Run by hand (not via `prisma migrate`) because this repo's schema.prisma is
// stale relative to the live DB (shared with the separate prestige-inv app),
// so an auto-generated migration from it would try to drop ~15 live tables.
await p.$executeRawUnsafe(`ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "sourceWebsite" TEXT`);
await p.$executeRawUnsafe(`ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "sourceProductUrl" TEXT`);
await p.$executeRawUnsafe(`ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "sourceImageUrl" TEXT`);
console.log('Columns ensured.');
await p.$disconnect();
