import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const all = await prisma.product.findMany({
    select: {
      id: true,
      slug: true,
      name: true,
      brand: { select: { name: true, slug: true } },
      collection: true,
      size: true,
      sizes: true,
      finish: true,
      surface: true,
      material: true,
      category: { select: { name: true, slug: true, parent: { select: { name: true, slug: true } } } },
      sku: true,
      productCode: true,
      lifestyleImage: true,
      textureImage: true,
      images: true,
      image_key: true,
      thumbnail_key: true,
      sourceWebsite: true,
      sourceProductUrl: true,
      sourceImageUrl: true,
      status: true,
      published: true,
    },
    orderBy: [{ brand: { name: 'asc' } }, { name: 'asc' }]
  });

  const missing = all.filter(p => {
    const imgs = Array.isArray(p.images) ? p.images.filter(Boolean) : [];
    return !p.lifestyleImage?.trim() && !p.textureImage?.trim() && imgs.length === 0 && !p.image_key?.trim() && !p.thumbnail_key?.trim();
  });

  console.log(`Found ${missing.length} products with no images:`);
  console.log(JSON.stringify(missing, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
