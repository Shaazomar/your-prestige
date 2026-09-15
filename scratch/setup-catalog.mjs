import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

const slugify = (s) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

async function main() {
  // 1. Ensure the two top-level route buckets exist as real Category rows.
  // /products/[category] is hardcoded to exactly "tiles" | "sanitary" |
  // "designer-picks", and the server-side search path filters strictly by
  // `category.slug === f.category` — so every product needs its categoryId
  // pointing directly at one of these for that route to find it.
  const tiles = await p.category.upsert({
    where: { slug: 'tiles' },
    update: {},
    create: { slug: 'tiles', name: 'Tiles', description: 'Marble, porcelain and ceramic surfaces.', sortOrder: 1, published: true },
  });
  const sanitary = await p.category.upsert({
    where: { slug: 'sanitary' },
    update: {},
    create: { slug: 'sanitary', name: 'Sanitaryware', description: 'Faucets, showers, wellness systems and bathroom fittings.', sortOrder: 2, published: true },
  });
  console.log('tiles category id:', tiles.id);
  console.log('sanitary category id:', sanitary.id);

  // 2. Safety backfill: existing published products with no categoryId only
  // render under /products/tiles today via the client-side fallback path
  // (resolveCategory() defaults to "tiles"). Importing ~hundreds of new
  // products is about to push the catalog past CATALOG_CLIENT_LIMIT (300),
  // which flips /products/tiles to the server-side searchCatalog() path —
  // that path requires a real categoryId match and would silently drop every
  // null-category product from that page. Backfilling prevents that
  // regression; it changes no product's *visible* category (tiles was
  // already what they resolved to).
  const backfill = await p.product.updateMany({
    where: { categoryId: null, deletedAt: null },
    data: { categoryId: tiles.id },
  });
  console.log('Backfilled categoryId -> tiles for', backfill.count, 'existing products');

  // 3. Brand rows for the six sources. Motto/Velzone/Lonix already exist;
  // Artize/Essco/Jaquar are new. Upsert is idempotent either way.
  const brands = [
    { slug: 'artize', name: 'Artize', website: 'https://www.artize.com/in/products' },
    { slug: 'essco', name: 'Essco', website: 'https://www.esscobathware.com/en-gb' },
    { slug: 'jaquar', name: 'Jaquar', website: 'https://www.jaquar.com/en/' },
    { slug: 'motto', name: 'Motto', website: 'https://www.mottogroup.in/' },
    { slug: 'velzone', name: 'Velzone', website: 'https://velzonegranito.com/' },
    { slug: 'lonix', name: 'Lonix', website: 'https://www.lonixceramica.com/' },
  ];
  const brandIds = {};
  for (const b of brands) {
    const row = await p.brand.upsert({
      where: { slug: b.slug },
      update: { website: b.website, published: true },
      create: { slug: b.slug, name: b.name, website: b.website, published: true },
    });
    brandIds[b.slug] = row.id;
  }
  console.log('brandIds', brandIds);

  await p.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
