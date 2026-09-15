-- Product variants + catalogue browsing indexes.
--
-- Hand-written and additive, per the warning at the top of schema.prisma: this
-- repo's schema file is stale relative to the live database (prestige-inv, a
-- separate app on the same Postgres, owns tables this file does not declare),
-- so `prisma migrate dev` / `db push` would generate DROPs for everything it
-- cannot see. Nothing here drops, renames or rewrites anything.
--
-- Safe to run more than once — every statement is IF NOT EXISTS.
--
--   psql "$DIRECT_URL" -f prisma/sql/2026-09-15-product-variants.sql
--   npx prisma generate
--
-- Touches no depot table: not Inventory, InventoryBlock, InventoryHistory,
-- StockBlock, StockBooking or any prestige-inv table. ProductVariant carries
-- no inventory relation by design — stock stays keyed to Product
-- (Inventory.productId is unique), so variants cannot create, move or orphan
-- a stock row, and a catalogue-only product still needs no inventory record.

BEGIN;

-- ————— ProductVariant —————

CREATE TABLE IF NOT EXISTS "ProductVariant" (
    "id"        TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sku"       TEXT,
    "name"      TEXT,
    "size"      TEXT,
    "finish"    TEXT,
    "color"     TEXT,
    "surface"   TEXT,
    "thickness" TEXT,
    "unit"      TEXT,
    "price"     DECIMAL(10,2),
    "mrp"       DECIMAL(10,2),
    "image"     TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active"    BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

CREATE INDEX        IF NOT EXISTS "ProductVariant_productId_idx"     ON "ProductVariant"("productId");
CREATE INDEX        IF NOT EXISTS "ProductVariant_sku_idx"           ON "ProductVariant"("sku");
CREATE INDEX        IF NOT EXISTS "ProductVariant_active_idx"        ON "ProductVariant"("active");
CREATE UNIQUE INDEX IF NOT EXISTS "ProductVariant_productId_sku_key" ON "ProductVariant"("productId", "sku");

-- ON DELETE CASCADE: a variant has no meaning without its product, and it
-- holds no stock, so there is nothing to strand.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ProductVariant_productId_fkey'
  ) THEN
    ALTER TABLE "ProductVariant"
      ADD CONSTRAINT "ProductVariant_productId_fkey"
      FOREIGN KEY ("productId") REFERENCES "Product"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

-- ————— Browsing indexes —————
--
-- /brands/[brand] and /brands/[brand]/[category] filter on brand + category
-- while excluding unpublished and soft-deleted rows. One composite index
-- serves both rather than three separate ones.

CREATE INDEX IF NOT EXISTS "Product_brandId_categoryId_published_deletedAt_idx"
  ON "Product"("brandId", "categoryId", "published", "deletedAt");

CREATE INDEX IF NOT EXISTS "Product_categoryId_published_deletedAt_idx"
  ON "Product"("categoryId", "published", "deletedAt");

-- The review queue reads this column directly.
CREATE INDEX IF NOT EXISTS "Product_needsReview_idx" ON "Product"("needsReview");

COMMIT;

-- ————— Search indexes —————
--
-- Catalogue search is ILIKE '%term%' across name, SKU, product code and
-- collection. A leading wildcard cannot use a btree index, so at five to six
-- thousand products every search was a sequential scan. pg_trgm makes these
-- index-backed.
--
-- Outside the transaction and individually guarded: a role without permission
-- to install the extension still keeps everything above, and search simply
-- falls back to the scan it already did.

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
    CREATE INDEX IF NOT EXISTS "Product_name_trgm_idx"        ON "Product"        USING gin ("name"        gin_trgm_ops);
    CREATE INDEX IF NOT EXISTS "Product_sku_trgm_idx"         ON "Product"        USING gin ("sku"         gin_trgm_ops);
    CREATE INDEX IF NOT EXISTS "Product_productCode_trgm_idx" ON "Product"        USING gin ("productCode" gin_trgm_ops);
    CREATE INDEX IF NOT EXISTS "Product_collection_trgm_idx"  ON "Product"        USING gin ("collection"  gin_trgm_ops);
    CREATE INDEX IF NOT EXISTS "ProductVariant_sku_trgm_idx"  ON "ProductVariant" USING gin ("sku"         gin_trgm_ops);
  END IF;
END
$$;
