import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("Checking and initializing AboutPerson table in PostgreSQL...");
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "AboutPerson" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "designation" TEXT NOT NULL,
      "description" TEXT,
      "eyebrow" TEXT,
      "image" TEXT NOT NULL,
      "imageKey" TEXT,
      "imageAlt" TEXT,
      "type" TEXT NOT NULL DEFAULT 'Inauguration',
      "date" TEXT,
      "location" TEXT,
      "displayOrder" INTEGER NOT NULL DEFAULT 0,
      "active" BOOLEAN NOT NULL DEFAULT true,
      "createdById" TEXT,
      "updatedById" TEXT,
      "deletedAt" TIMESTAMP(3),
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "AboutPerson_type_active_deletedAt_idx" ON "AboutPerson"("type", "active", "deletedAt");
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "AboutPerson_displayOrder_idx" ON "AboutPerson"("displayOrder");
  `);

  console.log("AboutPerson table initialized successfully!");
}

main().catch((err) => {
  console.error("Initialization error:", err);
  process.exit(1);
});
