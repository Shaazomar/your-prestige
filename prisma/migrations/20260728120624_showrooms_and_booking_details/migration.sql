-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "interestedIn" JSONB,
ADD COLUMN     "preferredTime" TEXT,
ADD COLUMN     "showroomId" TEXT;

-- CreateTable
CREATE TABLE "Showroom" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subtitle" TEXT,
    "addressLine" TEXT NOT NULL,
    "locality" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'Karnataka',
    "postalCode" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "mapUrl" TEXT,
    "mapEmbedUrl" TEXT,
    "directions" TEXT,
    "phone" TEXT NOT NULL,
    "whatsapp" TEXT,
    "email" TEXT,
    "managerName" TEXT,
    "managerPhone" TEXT,
    "hoursWeekdays" TEXT NOT NULL DEFAULT 'Monday–Saturday: 9:00 AM – 7:00 PM',
    "hoursSunday" TEXT NOT NULL DEFAULT 'Sunday: Closed',
    "heroImage" TEXT,
    "gallery" JSONB,
    "video" TEXT,
    "description" TEXT,
    "brands" JSONB,
    "amenities" JSONB,
    "featuredProductIds" JSONB,
    "isFlagship" BOOLEAN NOT NULL DEFAULT false,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedById" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Showroom_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Showroom_slug_key" ON "Showroom"("slug");

-- CreateIndex
CREATE INDEX "Showroom_published_deletedAt_idx" ON "Showroom"("published", "deletedAt");

-- CreateIndex
CREATE INDEX "Showroom_city_idx" ON "Showroom"("city");

-- CreateIndex
CREATE INDEX "Booking_showroomId_idx" ON "Booking"("showroomId");

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_showroomId_fkey" FOREIGN KEY ("showroomId") REFERENCES "Showroom"("id") ON DELETE SET NULL ON UPDATE CASCADE;

