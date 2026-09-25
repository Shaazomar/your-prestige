import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const all = await prisma.product.findMany({
    select: {
      id: true,
      lifestyleImage: true,
      textureImage: true,
      images: true,
      image_key: true,
      thumbnail_key: true,
      status: true,
      published: true,
    }
  });

  const missingIds = all
    .filter(p => {
      const imgs = Array.isArray(p.images) ? p.images.filter(Boolean) : [];
      return !p.lifestyleImage?.trim() &&
             !p.textureImage?.trim() &&
             imgs.length === 0 &&
             !p.image_key?.trim() &&
             !p.thumbnail_key?.trim();
    })
    .map(p => p.id);

  console.log(`Found ${missingIds.length} missing product IDs.`);

  if (missingIds.length > 0) {
    const res = await prisma.product.updateMany({
      where: { id: { in: missingIds } },
      data: {
        published: false,
        status: 'DRAFT',
        needsReview: true,
        reviewReason: 'Missing product photography - hidden from public website until verified image is uploaded',
      }
    });
    console.log(`Updated ${res.count} products to DRAFT/Hidden.`);
  }

  const total = await prisma.product.count();
  const publishedCount = await prisma.product.count({ where: { published: true, deletedAt: null, status: 'ACTIVE' } });
  const draftCount = await prisma.product.count({ where: { status: 'DRAFT' } });

  console.log({
    totalProductsInDB: total,
    publicActiveProducts: publishedCount,
    draftHiddenProducts: draftCount,
    deletedProducts: 0,
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
