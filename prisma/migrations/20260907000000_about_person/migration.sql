-- AboutPerson was added to schema.prisma without a migration, so the table was
-- never created in any database the migrations were deployed to. Every read of
-- it (the public /about page and the admin People & Guests module) failed with
-- Prisma P2021 "table does not exist".
--
-- Purely additive: creates one new table and its two indexes. Touches no
-- existing table, column or row. IF NOT EXISTS keeps it a no-op on any
-- environment where the table was already created by hand.

-- CreateTable
CREATE TABLE IF NOT EXISTS "AboutPerson" (
    "id" TEXT NOT NULL,
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AboutPerson_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AboutPerson_type_active_deletedAt_idx" ON "AboutPerson"("type", "active", "deletedAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AboutPerson_displayOrder_idx" ON "AboutPerson"("displayOrder");
