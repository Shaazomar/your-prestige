-- CreateEnum
CREATE TYPE "ImportStatus" AS ENUM ('UPLOADED', 'ANALYZING', 'EXTRACTING', 'IMAGING', 'LINKING', 'ENRICHING', 'READY', 'PUBLISHING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ExtractedStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'MERGED', 'PUBLISHED');

-- AlterTable
ALTER TABLE "Faq" ADD COLUMN     "showroomId" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "applicationTags" JSONB,
ADD COLUMN     "blurData" TEXT,
ADD COLUMN     "productCode" TEXT,
ADD COLUMN     "searchKeywords" JSONB,
ADD COLUMN     "sourceImportId" TEXT,
ADD COLUMN     "surface" TEXT;

-- AlterTable
ALTER TABLE "Seo" ADD COLUMN     "landingPageId" TEXT;

-- AlterTable
ALTER TABLE "Showroom" ADD COLUMN     "googlePhotos" JSONB,
ADD COLUMN     "googlePlaceId" TEXT,
ADD COLUMN     "googleRating" DOUBLE PRECISION,
ADD COLUMN     "googleReviewCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "googleReviewUrl" TEXT,
ADD COLUMN     "googleWriteReviewUrl" TEXT;

-- AlterTable
ALTER TABLE "Testimonial" ADD COLUMN     "authorPhoto" TEXT,
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "showroomId" TEXT;

-- CreateTable
CREATE TABLE "CatalogImport" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "filePublicId" TEXT,
    "fileSize" INTEGER NOT NULL,
    "brandId" TEXT,
    "brandNameGuess" TEXT,
    "status" "ImportStatus" NOT NULL DEFAULT 'UPLOADED',
    "phaseMessage" TEXT,
    "pageCount" INTEGER NOT NULL DEFAULT 0,
    "cursor" INTEGER NOT NULL DEFAULT 0,
    "processed" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL DEFAULT 0,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "lockedAt" TIMESTAMP(3),
    "lockToken" TEXT,
    "pageText" JSONB,
    "stats" JSONB,
    "isScanned" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedById" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogImport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExtractedProduct" (
    "id" TEXT NOT NULL,
    "importId" TEXT NOT NULL,
    "pageStart" INTEGER NOT NULL,
    "pageEnd" INTEGER,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rawText" TEXT,
    "fieldScores" JSONB,
    "brandName" TEXT,
    "collectionName" TEXT,
    "name" TEXT NOT NULL,
    "productCode" TEXT,
    "sizes" JSONB,
    "finish" TEXT,
    "thickness" TEXT,
    "material" TEXT,
    "applications" JSONB,
    "applicationTags" JSONB,
    "color" TEXT,
    "surface" TEXT,
    "description" TEXT,
    "slug" TEXT,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "metaKeywords" JSONB,
    "searchKeywords" JSONB,
    "premiumDescription" TEXT,
    "faqs" JSONB,
    "internalLinks" JSONB,
    "jsonLd" TEXT,
    "relatedSlugs" JSONB,
    "enrichedAt" TIMESTAMP(3),
    "enrichedBy" TEXT,
    "heroAssetId" TEXT,
    "textureAssetId" TEXT,
    "status" "ExtractedStatus" NOT NULL DEFAULT 'PENDING',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "publishAsDraft" BOOLEAN NOT NULL DEFAULT true,
    "reviewNote" TEXT,
    "fingerprint" TEXT NOT NULL,
    "mergedIntoId" TEXT,
    "duplicateOfProductId" TEXT,
    "productId" TEXT,
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExtractedProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportAsset" (
    "id" TEXT NOT NULL,
    "importId" TEXT NOT NULL,
    "page" INTEGER NOT NULL,
    "objectRef" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "bytes" INTEGER NOT NULL,
    "pageX" DOUBLE PRECISION,
    "pageY" DOUBLE PRECISION,
    "pageW" DOUBLE PRECISION,
    "pageH" DOUBLE PRECISION,
    "contentHash" TEXT NOT NULL,
    "dHash" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'unknown',
    "rejected" BOOLEAN NOT NULL DEFAULT false,
    "rejectReason" TEXT,
    "url" TEXT,
    "blurDataUrl" TEXT,
    "altText" TEXT,
    "caption" TEXT,
    "title" TEXT,
    "seoFilename" TEXT,
    "mediaId" TEXT,
    "extractedProductId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImportAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LandingPage" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'local',
    "title" TEXT NOT NULL,
    "heading" TEXT NOT NULL,
    "subheading" TEXT,
    "intro" TEXT,
    "blocks" JSONB,
    "city" TEXT,
    "locality" TEXT,
    "areaServed" JSONB,
    "serviceType" TEXT,
    "brandId" TEXT,
    "heroImage" TEXT,
    "gallery" JSONB,
    "faqs" JSONB,
    "showroomIds" JSONB,
    "featuredProductIds" JSONB,
    "jsonLd" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedById" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LandingPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GooglePost" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'UPDATE',
    "title" TEXT NOT NULL,
    "body" TEXT,
    "image" TEXT,
    "ctaLabel" TEXT,
    "ctaUrl" TEXT,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "sourceUrl" TEXT,
    "showroomId" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedById" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GooglePost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CatalogImport_status_deletedAt_idx" ON "CatalogImport"("status", "deletedAt");

-- CreateIndex
CREATE INDEX "CatalogImport_brandId_idx" ON "CatalogImport"("brandId");

-- CreateIndex
CREATE INDEX "CatalogImport_deletedAt_idx" ON "CatalogImport"("deletedAt");

-- CreateIndex
CREATE INDEX "ExtractedProduct_importId_status_idx" ON "ExtractedProduct"("importId", "status");

-- CreateIndex
CREATE INDEX "ExtractedProduct_fingerprint_idx" ON "ExtractedProduct"("fingerprint");

-- CreateIndex
CREATE INDEX "ExtractedProduct_status_deletedAt_idx" ON "ExtractedProduct"("status", "deletedAt");

-- CreateIndex
CREATE INDEX "ExtractedProduct_productId_idx" ON "ExtractedProduct"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "ExtractedProduct_importId_fingerprint_key" ON "ExtractedProduct"("importId", "fingerprint");

-- CreateIndex
CREATE INDEX "ImportAsset_importId_page_idx" ON "ImportAsset"("importId", "page");

-- CreateIndex
CREATE INDEX "ImportAsset_dHash_idx" ON "ImportAsset"("dHash");

-- CreateIndex
CREATE INDEX "ImportAsset_extractedProductId_idx" ON "ImportAsset"("extractedProductId");

-- CreateIndex
CREATE UNIQUE INDEX "ImportAsset_importId_contentHash_key" ON "ImportAsset"("importId", "contentHash");

-- CreateIndex
CREATE UNIQUE INDEX "LandingPage_slug_key" ON "LandingPage"("slug");

-- CreateIndex
CREATE INDEX "LandingPage_published_deletedAt_idx" ON "LandingPage"("published", "deletedAt");

-- CreateIndex
CREATE INDEX "LandingPage_city_idx" ON "LandingPage"("city");

-- CreateIndex
CREATE INDEX "GooglePost_published_deletedAt_idx" ON "GooglePost"("published", "deletedAt");

-- CreateIndex
CREATE INDEX "GooglePost_showroomId_idx" ON "GooglePost"("showroomId");

-- CreateIndex
CREATE INDEX "Faq_showroomId_idx" ON "Faq"("showroomId");

-- CreateIndex
CREATE INDEX "Product_collection_idx" ON "Product"("collection");

-- CreateIndex
CREATE INDEX "Product_sourceImportId_idx" ON "Product"("sourceImportId");

-- CreateIndex
CREATE UNIQUE INDEX "Seo_landingPageId_key" ON "Seo"("landingPageId");

-- CreateIndex
CREATE INDEX "Testimonial_showroomId_idx" ON "Testimonial"("showroomId");

-- CreateIndex
CREATE INDEX "Testimonial_published_deletedAt_idx" ON "Testimonial"("published", "deletedAt");

-- AddForeignKey
ALTER TABLE "Testimonial" ADD CONSTRAINT "Testimonial_showroomId_fkey" FOREIGN KEY ("showroomId") REFERENCES "Showroom"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Faq" ADD CONSTRAINT "Faq_showroomId_fkey" FOREIGN KEY ("showroomId") REFERENCES "Showroom"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Seo" ADD CONSTRAINT "Seo_landingPageId_fkey" FOREIGN KEY ("landingPageId") REFERENCES "LandingPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogImport" ADD CONSTRAINT "CatalogImport_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExtractedProduct" ADD CONSTRAINT "ExtractedProduct_importId_fkey" FOREIGN KEY ("importId") REFERENCES "CatalogImport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExtractedProduct" ADD CONSTRAINT "ExtractedProduct_heroAssetId_fkey" FOREIGN KEY ("heroAssetId") REFERENCES "ImportAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExtractedProduct" ADD CONSTRAINT "ExtractedProduct_textureAssetId_fkey" FOREIGN KEY ("textureAssetId") REFERENCES "ImportAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExtractedProduct" ADD CONSTRAINT "ExtractedProduct_mergedIntoId_fkey" FOREIGN KEY ("mergedIntoId") REFERENCES "ExtractedProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportAsset" ADD CONSTRAINT "ImportAsset_importId_fkey" FOREIGN KEY ("importId") REFERENCES "CatalogImport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportAsset" ADD CONSTRAINT "ImportAsset_extractedProductId_fkey" FOREIGN KEY ("extractedProductId") REFERENCES "ExtractedProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LandingPage" ADD CONSTRAINT "LandingPage_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GooglePost" ADD CONSTRAINT "GooglePost_showroomId_fkey" FOREIGN KEY ("showroomId") REFERENCES "Showroom"("id") ON DELETE SET NULL ON UPDATE CASCADE;

