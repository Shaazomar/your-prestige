import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

const DRY_RUN = process.argv.includes('--dry-run');

// Deterministic dictionary, built directly from audited `collection` values.
const LABEL_TO_SLUG = {
  'Faucets': 'faucets',
  'Showers': 'showers',
  'Sanitaryware': 'sanitary',
  'Bath Fittings': 'bath-fittings',
  'Wellness': 'wellness',
  'Flushing Systems': 'flushing-systems',
  'Water Heaters': 'water-heaters',
  'Shower Enclosures': 'shower-enclosures',
  'Accessories': 'accessories',
  'Lighting': 'lighting',
};

const categories = await p.category.findMany({ where: { slug: { in: Object.values(LABEL_TO_SLUG) } }, select: { id: true, slug: true } });
const slugToId = Object.fromEntries(categories.map(c => [c.slug, c.id]));
console.log('Category slug -> id map:', slugToId);

const brands = await p.brand.findMany({ where: { slug: { in: ['jaquar', 'artize', 'essco'] } }, select: { id: true, slug: true } });
const brandIdBySlug = Object.fromEntries(brands.map(b => [b.slug, b.id]));

let totalUpdated = 0;
const beforeTotal = await p.product.count();
const beforeInventoryIds = (await p.inventory.findMany({ select: { productId: true } })).map(r => r.productId).sort();

for (const brandSlug of ['jaquar', 'artize', 'essco']) {
  const brandId = brandIdBySlug[brandSlug];
  for (const [label, slug] of Object.entries(LABEL_TO_SLUG)) {
    const categoryId = slugToId[slug];
    const where = { brandId, collection: label };
    const count = await p.product.count({ where });
    if (count === 0) continue;
    if (DRY_RUN) {
      console.log(`[dry-run] ${brandSlug} / "${label}" -> ${slug}: would update ${count}`);
    } else {
      const res = await p.product.updateMany({ where, data: { categoryId } });
      console.log(`${brandSlug} / "${label}" -> ${slug}: updated ${res.count}`);
      totalUpdated += res.count;
    }
  }
}

console.log('\nTotal updated (dictionary matches):', totalUpdated);

// ---- Artize long-tail (~54 rows): classify by inspecting actual product names ----
const artizeId = brandIdBySlug['artize'];
const longTail = await p.product.findMany({
  where: { brandId: artizeId, collection: { notIn: Object.keys(LABEL_TO_SLUG) } },
  select: { id: true, name: true, collection: true, productCode: true },
});
console.log(`\nArtize long-tail rows: ${longTail.length}`);

const KEYWORD_RULES = [
  { slug: 'faucets', re: /mixer|tap\b|faucet|spout|cock\b|angle valve|bib\b|pillar/i },
  { slug: 'showers', re: /shower|rain|overhead|hand ?shower|diverter|thermostatic|thermatik/i },
  { slug: 'wellness', re: /sauna|steam|jacuzzi|bathtub|whirlpool/i },
  { slug: 'sanitary', re: /cistern|water closet|\bwc\b|urinal|wash ?basin|\bpan\b|commode/i },
  { slug: 'accessories', re: /towel|robe hook|soap dish|holder|tumbler|rod\b|paper holder|rack\b/i },
];

let longTailClassified = 0;
let longTailFlagged = 0;
for (const row of longTail) {
  const haystack = `${row.name} ${row.collection ?? ''}`;
  const match = KEYWORD_RULES.find(r => r.re.test(haystack));
  if (match) {
    const categoryId = slugToId[match.slug];
    if (!DRY_RUN) {
      await p.product.update({ where: { id: row.id }, data: { categoryId } });
    }
    console.log(`  [matched -> ${match.slug}] "${row.name}" (collection="${row.collection}")`);
    longTailClassified++;
  } else {
    if (!DRY_RUN) {
      await p.$executeRawUnsafe(
        `UPDATE "Product" SET "needsReview" = true, "reviewReason" = $1 WHERE id = $2`,
        `No keyword match for collection="${row.collection}" name="${row.name}"`,
        row.id
      );
    }
    console.log(`  [NEEDS REVIEW] "${row.name}" (collection="${row.collection}")`);
    longTailFlagged++;
  }
}

console.log(`\nLong-tail classified: ${longTailClassified}, flagged needsReview: ${longTailFlagged}`);

if (!DRY_RUN) {
  const afterTotal = await p.product.count();
  const afterInventoryIds = (await p.inventory.findMany({ select: { productId: true } })).map(r => r.productId).sort();
  console.log('\n=== Safety checks ===');
  console.log('Product count before/after:', beforeTotal, afterTotal, beforeTotal === afterTotal ? 'OK (no duplicates)' : 'MISMATCH!!');
  console.log('Inventory productId set unchanged:', JSON.stringify(beforeInventoryIds) === JSON.stringify(afterInventoryIds) ? 'OK' : 'MISMATCH!!');
}

await p.$disconnect();
