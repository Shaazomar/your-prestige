import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

// Idempotent: safe to re-run. Upserts by slug.

const bathware = await p.category.upsert({
  where: { slug: 'bathware' },
  update: { name: 'Bathware', published: true },
  create: {
    slug: 'bathware',
    name: 'Bathware',
    description: 'Sanitaryware, faucets, showers and bath fittings from our authorised brand partners.',
    published: true,
    sortOrder: 1,
  },
});
console.log('bathware:', bathware.id);

// Repoint the EXISTING "sanitary" category (already referenced by 5,750
// products' categoryId) to become the "Sanitaryware" child — id and slug
// stay stable so nothing that already points at it breaks.
const sanitary = await p.category.update({
  where: { slug: 'sanitary' },
  data: { name: 'Sanitaryware', parentId: bathware.id },
});
console.log('sanitary (renamed to Sanitaryware, reparented):', sanitary.id);

const newChildren = [
  { slug: 'faucets', name: 'Faucets' },
  { slug: 'showers', name: 'Showers' },
  { slug: 'bath-fittings', name: 'Bath Fittings' },
  { slug: 'wellness', name: 'Wellness' },
  { slug: 'flushing-systems', name: 'Flushing Systems' },
  { slug: 'water-heaters', name: 'Water Heaters' },
  { slug: 'shower-enclosures', name: 'Shower Enclosures' },
  { slug: 'accessories', name: 'Accessories' },
  { slug: 'lighting', name: 'Lighting' },
];

let sortOrder = 1;
for (const c of newChildren) {
  const row = await p.category.upsert({
    where: { slug: c.slug },
    update: { name: c.name, parentId: bathware.id, published: true },
    create: {
      slug: c.slug,
      name: c.name,
      parentId: bathware.id,
      published: true,
      sortOrder: sortOrder++,
    },
  });
  console.log(c.slug, '->', row.id);
}

console.log('\n=== Final tree ===');
const tree = await p.category.findMany({
  where: { deletedAt: null },
  select: { slug: true, name: true, parentId: true },
  orderBy: [{ parentId: 'asc' }, { sortOrder: 'asc' }],
});
console.log(tree);

await p.$disconnect();
