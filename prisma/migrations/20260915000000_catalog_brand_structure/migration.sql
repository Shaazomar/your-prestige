-- Brand-first catalogue structure.
--
-- Purely additive. Creates one new table (ProductVariant), three new
-- defaulted/nullable columns on Product, and indexes. It does not touch
-- Inventory, InventoryBlock, InventoryHistory, StockBlock or any other depot
-- table, and changes no existing row's data: `classification` lands on every
-- existing product as UNCLASSIFIED, which is exactly "not yet looked at" and
-- is what the classifier reads on its first run.
--
-- ProductVariant deliberately has no inventory relation. Stock stays keyed to
-- Product (Inventory.productId is unique), so variants cannot create, move or
-- orphan a stock row, and a catalogue-only product still needs no inventory
-- record.

-- CreateEnum
CREATE TYPE "ClassificationStatus" AS ENUM ('UNCLASSIFIED', 'AUTO', 'MANUAL', 'NEEDS_REVIEW');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "classification" "ClassificationStatus" NOT NULL DEFAULT 'UNCLASSIFIED',
ADD COLUMN     "classificationNote" TEXT,
ADD COLUMN     "classifiedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "ProductVariant" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sku" TEXT,
    "name" TEXT,
    "size" TEXT,
    "finish" TEXT,
    "color" TEXT,
    "surface" TEXT,
    "thickness" TEXT,
    "unit" TEXT,
    "price" DECIMAL(10,2),
    "mrp" DECIMAL(10,2),
    "image" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductVariant_productId_idx" ON "ProductVariant"("productId");

-- CreateIndex
CREATE INDEX "ProductVariant_sku_idx" ON "ProductVariant"("sku");

-- CreateIndex
CREATE INDEX "ProductVariant_active_idx" ON "ProductVariant"("active");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_productId_sku_key" ON "ProductVariant"("productId", "sku");

-- CreateIndex
CREATE INDEX "Product_brandId_categoryId_published_deletedAt_idx" ON "Product"("brandId", "categoryId", "published", "deletedAt");

-- CreateIndex
CREATE INDEX "Product_categoryId_published_deletedAt_idx" ON "Product"("categoryId", "published", "deletedAt");

-- CreateIndex
CREATE INDEX "Product_classification_idx" ON "Product"("classification");

-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- ————— Search indexes —————
--
-- Catalogue search is ILIKE '%term%' across name, SKU, product code and
-- collection. A leading wildcard cannot use a btree index, so at a few
-- thousand products every search was a sequential scan. pg_trgm makes these
-- index-backed.
--
-- Wrapped so a database role without permission to install the extension
-- still applies the rest of the migration: search then falls back to the
-- sequential scan it already did, rather than the deploy failing.
DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS pg_trgm;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_trgm unavailable (%); catalogue search will not use trigram indexes', SQLERRM;
END
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') THEN
    CREATE INDEX IF NOT EXISTS "Product_name_trgm_idx"        ON "Product" USING gin ("name" gin_trgm_ops);
    CREATE INDEX IF NOT EXISTS "Product_sku_trgm_idx"         ON "Product" USING gin ("sku" gin_trgm_ops);
    CREATE INDEX IF NOT EXISTS "Product_productCode_trgm_idx" ON "Product" USING gin ("productCode" gin_trgm_ops);
    CREATE INDEX IF NOT EXISTS "Product_collection_trgm_idx"  ON "Product" USING gin ("collection" gin_trgm_ops);
    CREATE INDEX IF NOT EXISTS "ProductVariant_sku_trgm_idx"  ON "ProductVariant" USING gin ("sku" gin_trgm_ops);
  END IF;
END
$$;
