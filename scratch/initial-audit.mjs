import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const total = await prisma.product.count();
  const published = await prisma.product.count({ where: { published: true, deletedAt: null } });
  const active = await prisma.product.count({ where: { published: true, deletedAt: null, status: 'ACTIVE' } });
  const draft = await prisma.product.count({ where: { status: 'DRAFT' } });
  const archived = await prisma.product.count({ where: { status: 'ARCHIVED' } });

  console.log({
    total,
    published,
    active,
    draft,
    archived,
  });

  // Brands breakdown
  const brands = await prisma.brand.findMany({
    select: { id: true, name: true, slug: true, _count: { select: { products: true } } }
  });
  console.log('Brands:', brands.map(b => ({ name: b.name, slug: b.slug, count: b._count.products })));

  // Sample check on image fields
  const sample = await prisma.product.findMany({
    take: 20,
    select: {
      id: true,
      name: true,
      slug: true,
      brand: { select: { name: true } },
      lifestyleImage: true,
      textureImage: true,
      images: true,
      image_key: true,
      thumbnail_key: true,
      sourceWebsite: true,
      sourceProductUrl: true,
      sourceImageUrl: true,
      status: true,
      published: true
    }
  });
  console.log('Sample 20 products:', JSON.stringify(sample, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
