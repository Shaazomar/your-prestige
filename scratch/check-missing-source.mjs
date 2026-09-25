import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const missing = await prisma.product.findMany({
    where: {
      lifestyleImage: null,
      textureImage: null,
      images: { equals: null },
      image_key: null,
      thumbnail_key: null,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      importKey: true,
      sourceSheet: true,
      sourceRow: true,
      sourceWebsite: true,
      sourceProductUrl: true,
      sourceImageUrl: true,
      brand: { select: { name: true } },
    }
  });

  console.log('Sample missing products provenance:');
  console.log(JSON.stringify(missing.slice(0, 10), null, 2));

  const bySource = {};
  for (const p of missing) {
    const src = p.sourceWebsite || p.sourceSheet || 'no_source';
    bySource[src] = (bySource[src] || 0) + 1;
  }
  console.log('Missing products by source:', bySource);
}

main().catch(console.error).finally(() => prisma.$disconnect());
