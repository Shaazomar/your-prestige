import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

await p.$executeRawUnsafe(`ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "needsReview" BOOLEAN NOT NULL DEFAULT false`);
await p.$executeRawUnsafe(`ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "reviewReason" TEXT`);

const check = await p.$queryRawUnsafe(`
  SELECT column_name, data_type, column_default, is_nullable
  FROM information_schema.columns
  WHERE table_name = 'Product' AND column_name IN ('needsReview', 'reviewReason')
`);
console.log(check);

await p.$disconnect();
