import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Fetching all products to identify missing image records...');
  const all = await prisma.product.findMany({
    select: {
      id: true,
      slug: true,
      name: true,
      brand: { select: { name: true } },
      lifestyleImage: true,
      textureImage: true,
      images: true,
      image_key: true,
      thumbnail_key: true,
      status: true,
      published: true,
    }
  });

  const missingImageProducts = all.filter(p => {
    const imgs = Array.isArray(p.images) ? p.images.filter(Boolean) : [];
    return !p.lifestyleImage?.trim() &&
           !p.textureImage?.trim() &&
           imgs.length === 0 &&
           !p.image_key?.trim() &&
           !p.thumbnail_key?.trim();
  });

  console.log(`Identified ${missingImageProducts.length} products without any image.`);

  let updatedCount = 0;
  for (const p of missingImageProducts) {
    await prisma.product.update({
      where: { id: p.id },
      data: {
        published: false,
        status: 'DRAFT',
        needsReview: true,
        reviewReason: 'Missing product photography - hidden from public catalogue until verified image is uploaded',
      }
    });
    updatedCount++;
  }

  console.log(`Successfully updated ${updatedCount} products to DRAFT/Hidden with needsReview=true.`);

  // Verify counts
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
