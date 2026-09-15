import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

// Brand: media + featured products + short description
await p.$executeRawUnsafe(`ALTER TABLE "Brand" ADD COLUMN IF NOT EXISTS "shortDescription" TEXT`);
await p.$executeRawUnsafe(`ALTER TABLE "Brand" ADD COLUMN IF NOT EXISTS "mobileCoverImage" TEXT`);
await p.$executeRawUnsafe(`ALTER TABLE "Brand" ADD COLUMN IF NOT EXISTS "heroVideo" TEXT`);
await p.$executeRawUnsafe(`ALTER TABLE "Brand" ADD COLUMN IF NOT EXISTS "heroPoster" TEXT`);
await p.$executeRawUnsafe(`ALTER TABLE "Brand" ADD COLUMN IF NOT EXISTS "featuredProductIds" JSONB`);

// Category: banner image (distinct from card image)
await p.$executeRawUnsafe(`ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "bannerImage" TEXT`);

// Collection: optional brand scoping, no hard FK constraint (shared-schema safety)
await p.$executeRawUnsafe(`ALTER TABLE "Collection" ADD COLUMN IF NOT EXISTS "brandId" TEXT`);
await p.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Collection_brandId_idx" ON "Collection" ("brandId")`);

const check = await p.$queryRawUnsafe(`
  SELECT table_name, column_name, data_type
  FROM information_schema.columns
  WHERE (table_name = 'Brand' AND column_name IN ('shortDescription','mobileCoverImage','heroVideo','heroPoster','featuredProductIds'))
     OR (table_name = 'Category' AND column_name = 'bannerImage')
     OR (table_name = 'Collection' AND column_name = 'brandId')
  ORDER BY table_name, column_name
`);
console.log(check);

await p.$disconnect();
