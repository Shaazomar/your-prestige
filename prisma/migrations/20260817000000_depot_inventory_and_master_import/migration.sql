-- CreateEnum
CREATE TYPE "BlockedBy" AS ENUM ('SAMSHUDIN', 'SALMAN');

-- CreateEnum
CREATE TYPE "OfferType" AS ENUM ('PRODUCT', 'COLLECTION', 'CATEGORY', 'SEASONAL', 'FESTIVAL', 'LIMITED_TIME', 'FEATURED');

-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('SUPER_ADMIN', 'MANAGER', 'VIEWER', 'SHOWROOM_INCHARGE', 'SHOWROOM_STAFF', 'DEALER');
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "Role_old";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'VIEWER';
COMMIT;

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "UserStatus" ADD VALUE 'INACTIVE';
ALTER TYPE "UserStatus" ADD VALUE 'SUSPENDED';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "dealer_id" TEXT,
ADD COLUMN     "showroomId" TEXT,
ADD COLUMN     "warehouse_id" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "collectionId" TEXT,
ADD COLUMN     "coverage" TEXT,
ADD COLUMN     "image_key" TEXT,
ADD COLUMN     "importKey" TEXT,
ADD COLUMN     "mrp" DECIMAL(10,2),
ADD COLUMN     "newArrival" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "packing" TEXT,
ADD COLUMN     "price" DECIMAL(10,2),
ADD COLUMN     "shortDescription" TEXT,
ADD COLUMN     "size" TEXT,
ADD COLUMN     "sku" TEXT,
ADD COLUMN     "sourceRow" INTEGER,
ADD COLUMN     "sourceSheet" TEXT,
ADD COLUMN     "specifications" JSONB,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "thumbnail_key" TEXT,
ADD COLUMN     "unit" TEXT,
ADD COLUMN     "weight" TEXT;

-- AlterTable
ALTER TABLE "Offer" DROP COLUMN "image",
DROP COLUMN "published",
DROP COLUMN "showCountdown",
DROP COLUMN "title",
DROP COLUMN "validFrom",
DROP COLUMN "validUntil",
ADD COLUMN     "banner" TEXT,
ADD COLUMN     "categoryId" TEXT,
ADD COLUMN     "collectionId" TEXT,
ADD COLUMN     "discountPercentage" DOUBLE PRECISION,
ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "featured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "offerPrice" DECIMAL(10,2),
ADD COLUMN     "originalPrice" DECIMAL(10,2),
ADD COLUMN     "priority" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "productId" TEXT,
ADD COLUMN     "startDate" TIMESTAMP(3),
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "type" "OfferType" NOT NULL DEFAULT 'PRODUCT';

-- AlterTable
ALTER TABLE "Seo" ADD COLUMN     "collectionId" TEXT;

-- CreateTable
CREATE TABLE "Collection" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedById" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Warehouse" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "location" TEXT,
    "address" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Warehouse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dealer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "company" TEXT,
    "contact" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dealer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inventory" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "warehouseId" TEXT,
    "totalStock" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "availableStock" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "blockedStock" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "allocatedStock" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reservedStock" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "damagedStock" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "transitStock" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "deliveredStock" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "looseStock" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "minimumStock" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "maximumStock" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reorderLevel" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "stockStatus" TEXT NOT NULL DEFAULT 'OUT_OF_STOCK',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockBlock" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "inventoryId" TEXT NOT NULL,
    "warehouseId" TEXT,
    "dealerId" TEXT,
    "showroomId" TEXT,
    "quantity" DOUBLE PRECISION NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "remarks" TEXT,
    "block_number" TEXT,
    "block_type" TEXT NOT NULL DEFAULT 'BLOCKED',
    "blocked_by" "BlockedBy",
    "approvalRoute" TEXT NOT NULL DEFAULT 'DIRECT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "releasedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),

    CONSTRAINT "StockBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryMovement" (
    "id" TEXT NOT NULL,
    "inventoryId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "warehouseId" TEXT,
    "movementType" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "previousQuantity" DOUBLE PRECISION NOT NULL,
    "newQuantity" DOUBLE PRECISION NOT NULL,
    "referenceType" TEXT,
    "referenceId" TEXT,
    "reason" TEXT,
    "performedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shipment" (
    "id" TEXT NOT NULL,
    "shipmentNumber" TEXT NOT NULL,
    "supplier" TEXT,
    "warehouseId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'EXPECTED',
    "expectedDate" TIMESTAMP(3),
    "dispatchDate" TIMESTAMP(3),
    "arrivalDate" TIMESTAMP(3),
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShipmentItem" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "expectedQuantity" DOUBLE PRECISION NOT NULL,
    "receivedQuantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "damagedQuantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "shortQuantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "ShipmentItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryBlock" (
    "id" TEXT NOT NULL,
    "inventoryId" TEXT NOT NULL,
    "blockedBy" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "remarks" TEXT,
    "approvalStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "blockApprovedBy" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryHistory" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "type" TEXT NOT NULL,
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductImportBatch" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileHash" TEXT NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'OPENING_INVENTORY',
    "dryRun" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'RUNNING',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "createdRows" INTEGER NOT NULL DEFAULT 0,
    "updatedRows" INTEGER NOT NULL DEFAULT 0,
    "skippedRows" INTEGER NOT NULL DEFAULT 0,
    "warningRows" INTEGER NOT NULL DEFAULT 0,
    "failedRows" INTEGER NOT NULL DEFAULT 0,
    "brandsCreated" INTEGER NOT NULL DEFAULT 0,
    "categoriesCreated" INTEGER NOT NULL DEFAULT 0,
    "collectionsCreated" INTEGER NOT NULL DEFAULT 0,
    "inventoryCreated" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT,
    "errorReport" JSONB,

    CONSTRAINT "ProductImportBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockBooking" (
    "id" TEXT NOT NULL,
    "bookingNumber" TEXT NOT NULL,
    "dealerId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "requestedBy" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "releasedAt" TIMESTAMP(3),
    "notes" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "extensionRequested" BOOLEAN NOT NULL DEFAULT false,
    "extensionHours" INTEGER,
    "extensionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockBookingItem" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "requestedQuantity" DOUBLE PRECISION NOT NULL,
    "approvedQuantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reservedQuantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "allocatedQuantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fulfilledQuantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cancelledQuantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL DEFAULT 'Boxes',
    "remarks" TEXT,

    CONSTRAINT "StockBookingItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "audience_type" TEXT NOT NULL,
    "audience_filter" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scheduled_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'SENT',

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnnouncementRecipient" (
    "id" TEXT NOT NULL,
    "announcement_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "delivered_at" TIMESTAMP(3),
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnnouncementRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "data" JSONB,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsAppAnalytics" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "productId" TEXT,
    "productSku" TEXT,
    "productName" TEXT,
    "collectionName" TEXT,
    "quantity" TEXT,
    "unit" TEXT,
    "sourcePage" TEXT,
    "device" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhatsAppAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Collection_slug_key" ON "Collection"("slug");

-- CreateIndex
CREATE INDEX "Collection_deletedAt_idx" ON "Collection"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Warehouse_code_key" ON "Warehouse"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Dealer_email_key" ON "Dealer"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Inventory_productId_key" ON "Inventory"("productId");

-- CreateIndex
CREATE INDEX "Inventory_warehouseId_idx" ON "Inventory"("warehouseId");

-- CreateIndex
CREATE INDEX "Inventory_stockStatus_idx" ON "Inventory"("stockStatus");

-- CreateIndex
CREATE UNIQUE INDEX "StockBlock_block_number_key" ON "StockBlock"("block_number");

-- CreateIndex
CREATE INDEX "StockBlock_inventoryId_idx" ON "StockBlock"("inventoryId");

-- CreateIndex
CREATE INDEX "StockBlock_productId_idx" ON "StockBlock"("productId");

-- CreateIndex
CREATE INDEX "StockBlock_dealerId_idx" ON "StockBlock"("dealerId");

-- CreateIndex
CREATE INDEX "StockBlock_warehouseId_idx" ON "StockBlock"("warehouseId");

-- CreateIndex
CREATE INDEX "StockBlock_status_idx" ON "StockBlock"("status");

-- CreateIndex
CREATE INDEX "StockBlock_expiresAt_idx" ON "StockBlock"("expiresAt");

-- CreateIndex
CREATE INDEX "InventoryMovement_inventoryId_idx" ON "InventoryMovement"("inventoryId");

-- CreateIndex
CREATE INDEX "InventoryMovement_productId_idx" ON "InventoryMovement"("productId");

-- CreateIndex
CREATE INDEX "InventoryMovement_warehouseId_idx" ON "InventoryMovement"("warehouseId");

-- CreateIndex
CREATE INDEX "InventoryMovement_movementType_idx" ON "InventoryMovement"("movementType");

-- CreateIndex
CREATE INDEX "InventoryMovement_createdAt_idx" ON "InventoryMovement"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Shipment_shipmentNumber_key" ON "Shipment"("shipmentNumber");

-- CreateIndex
CREATE INDEX "Shipment_warehouseId_idx" ON "Shipment"("warehouseId");

-- CreateIndex
CREATE INDEX "Shipment_status_idx" ON "Shipment"("status");

-- CreateIndex
CREATE INDEX "ShipmentItem_shipmentId_idx" ON "ShipmentItem"("shipmentId");

-- CreateIndex
CREATE INDEX "ShipmentItem_productId_idx" ON "ShipmentItem"("productId");

-- CreateIndex
CREATE INDEX "InventoryBlock_inventoryId_idx" ON "InventoryBlock"("inventoryId");

-- CreateIndex
CREATE INDEX "InventoryBlock_approvalStatus_idx" ON "InventoryBlock"("approvalStatus");

-- CreateIndex
CREATE INDEX "ProductImportBatch_startedAt_idx" ON "ProductImportBatch"("startedAt");

-- CreateIndex
CREATE INDEX "ProductImportBatch_status_idx" ON "ProductImportBatch"("status");

-- CreateIndex
CREATE UNIQUE INDEX "StockBooking_bookingNumber_key" ON "StockBooking"("bookingNumber");

-- CreateIndex
CREATE INDEX "StockBooking_bookingNumber_idx" ON "StockBooking"("bookingNumber");

-- CreateIndex
CREATE INDEX "StockBooking_createdAt_idx" ON "StockBooking"("createdAt");

-- CreateIndex
CREATE INDEX "StockBooking_dealerId_idx" ON "StockBooking"("dealerId");

-- CreateIndex
CREATE INDEX "StockBooking_expiresAt_idx" ON "StockBooking"("expiresAt");

-- CreateIndex
CREATE INDEX "StockBooking_status_idx" ON "StockBooking"("status");

-- CreateIndex
CREATE INDEX "StockBooking_warehouseId_idx" ON "StockBooking"("warehouseId");

-- CreateIndex
CREATE INDEX "StockBookingItem_bookingId_idx" ON "StockBookingItem"("bookingId");

-- CreateIndex
CREATE INDEX "StockBookingItem_productId_idx" ON "StockBookingItem"("productId");

-- CreateIndex
CREATE INDEX "AnnouncementRecipient_announcement_id_idx" ON "AnnouncementRecipient"("announcement_id");

-- CreateIndex
CREATE INDEX "AnnouncementRecipient_user_id_idx" ON "AnnouncementRecipient"("user_id");

-- CreateIndex
CREATE INDEX "Notification_created_at_idx" ON "Notification"("created_at");

-- CreateIndex
CREATE INDEX "Notification_is_read_idx" ON "Notification"("is_read");

-- CreateIndex
CREATE INDEX "Notification_user_id_idx" ON "Notification"("user_id");

-- CreateIndex
CREATE INDEX "WhatsAppAnalytics_eventType_idx" ON "WhatsAppAnalytics"("eventType");

-- CreateIndex
CREATE INDEX "WhatsAppAnalytics_productId_idx" ON "WhatsAppAnalytics"("productId");

-- CreateIndex
CREATE INDEX "WhatsAppAnalytics_createdAt_idx" ON "WhatsAppAnalytics"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "Product_importKey_key" ON "Product"("importKey");

-- CreateIndex
CREATE INDEX "Product_collectionId_idx" ON "Product"("collectionId");

-- CreateIndex
CREATE INDEX "Offer_productId_idx" ON "Offer"("productId");

-- CreateIndex
CREATE INDEX "Offer_collectionId_idx" ON "Offer"("collectionId");

-- CreateIndex
CREATE INDEX "Offer_categoryId_idx" ON "Offer"("categoryId");

-- CreateIndex
CREATE INDEX "Offer_deletedAt_idx" ON "Offer"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Seo_collectionId_key" ON "Seo"("collectionId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_dealer_id_fkey" FOREIGN KEY ("dealer_id") REFERENCES "Dealer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_showroomId_fkey" FOREIGN KEY ("showroomId") REFERENCES "Showroom"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Seo" ADD CONSTRAINT "Seo_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockBlock" ADD CONSTRAINT "StockBlock_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "Inventory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockBlock" ADD CONSTRAINT "StockBlock_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockBlock" ADD CONSTRAINT "StockBlock_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "Dealer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockBlock" ADD CONSTRAINT "StockBlock_showroomId_fkey" FOREIGN KEY ("showroomId") REFERENCES "Showroom"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "Inventory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShipmentItem" ADD CONSTRAINT "ShipmentItem_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryBlock" ADD CONSTRAINT "InventoryBlock_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "Inventory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryHistory" ADD CONSTRAINT "InventoryHistory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockBooking" ADD CONSTRAINT "StockBooking_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "Dealer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockBooking" ADD CONSTRAINT "StockBooking_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockBookingItem" ADD CONSTRAINT "StockBookingItem_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "StockBooking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockBookingItem" ADD CONSTRAINT "StockBookingItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnouncementRecipient" ADD CONSTRAINT "AnnouncementRecipient_announcement_id_fkey" FOREIGN KEY ("announcement_id") REFERENCES "Announcement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnouncementRecipient" ADD CONSTRAINT "AnnouncementRecipient_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

