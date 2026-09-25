import { PrismaClient } from '@prisma/client';
import { writeFile } from 'fs/promises';

const prisma = new PrismaClient();

const BATHWARE_KEYWORDS = [
  { keyword: 'faucet', suggested: 'Faucets' },
  { keyword: 'basin mixer', suggested: 'Faucets' },
  { keyword: 'bath mixer', suggested: 'Faucets' },
  { keyword: 'diverter', suggested: 'Faucets' },
  { keyword: 'spout', suggested: 'Faucets' },
  { keyword: 'bib cock', suggested: 'Faucets' },
  { keyword: 'pillar cock', suggested: 'Faucets' },
  { keyword: 'sink mixer', suggested: 'Faucets' },
  { keyword: 'shower', suggested: 'Showers' },
  { keyword: 'overhead shower', suggested: 'Showers' },
  { keyword: 'hand shower', suggested: 'Showers' },
  { keyword: 'shower arm', suggested: 'Showers' },
  { keyword: 'shower panel', suggested: 'Showers' },
  { keyword: 'ewc', suggested: 'Sanitaryware' },
  { keyword: 'water closet', suggested: 'Sanitaryware' },
  { keyword: 'urinal', suggested: 'Sanitaryware' },
  { keyword: 'wash basin', suggested: 'Sanitaryware' },
  { keyword: 'seat cover', suggested: 'Sanitaryware' },
  { keyword: 'cistern', suggested: 'Flushing Systems' },
  { keyword: 'flush valve', suggested: 'Flushing Systems' },
  { keyword: 'bathtub', suggested: 'Wellness' },
  { keyword: 'whirlpool', suggested: 'Wellness' },
  { keyword: 'sauna', suggested: 'Wellness' },
  { keyword: 'geyser', suggested: 'Water Heaters' },
  { keyword: 'water heater', suggested: 'Water Heaters' },
  { keyword: 'towel ring', suggested: 'Accessories' },
  { keyword: 'towel rail', suggested: 'Accessories' },
  { keyword: 'soap dish', suggested: 'Accessories' },
  { keyword: 'robe hook', suggested: 'Accessories' },
  { keyword: 'tumbler holder', suggested: 'Accessories' },
  { keyword: 'paper holder', suggested: 'Accessories' },
  { keyword: 'grab bar', suggested: 'Accessories' },
  { keyword: 'mirror', suggested: 'Accessories' },
];

async function main() {
  const products = await prisma.product.findMany({
    select: {
      id: true,
      slug: true,
      name: true,
      brand: { select: { name: true } },
      category: { select: { id: true, name: true, slug: true, parent: { select: { name: true, slug: true } } } },
      sku: true,
      productCode: true,
      lifestyleImage: true,
      images: true,
      image_key: true,
      thumbnail_key: true,
      status: true,
      published: true,
    }
  });

  console.log(`Total products scanned for category mismatches: ${products.length}`);

  const mismatches = [];

  for (const p of products) {
    const categoryName = p.category?.name || 'Unassigned';
    const parentCategoryName = p.category?.parent?.name || '';
    const isUnderTiles = categoryName.toLowerCase().includes('tile') || parentCategoryName.toLowerCase().includes('tile') || categoryName === 'Unassigned';

    const text = `${p.name} ${p.sku || ''} ${p.productCode || ''}`.toLowerCase();

    if (isUnderTiles) {
      for (const rule of BATHWARE_KEYWORDS) {
        if (text.includes(rule.keyword)) {
          const imgs = Array.isArray(p.images) ? p.images.filter(Boolean) : [];
          const hasImg = !!(p.lifestyleImage?.trim() || imgs[0]?.trim() || p.image_key?.trim() || p.thumbnail_key?.trim());
          mismatches.push({
            id: p.id,
            slug: p.slug,
            name: p.name,
            brand: p.brand?.name || 'Unknown',
            sku: p.sku || p.productCode || '—',
            currentCategory: categoryName + (parentCategoryName ? ` (under ${parentCategoryName})` : ''),
            suggestedCategory: rule.suggested,
            matchedKeyword: rule.keyword,
            imageStatus: hasImg ? 'VALID' : 'MISSING',
          });
          break;
        }
      }
    }
  }

  console.log(`Found ${mismatches.length} products sitting under Tiles/Unassigned that belong to Bathware categories.`);
  
  // Breakdown by suggested category
  const breakdown = {};
  for (const m of mismatches) {
    breakdown[m.suggestedCategory] = (breakdown[m.suggestedCategory] || 0) + 1;
  }
  console.log('Breakdown by suggested category:');
  console.table(breakdown);

  console.log('Sample 10 mismatches:');
  console.table(mismatches.slice(0, 10).map(m => ({
    Product: m.name,
    Brand: m.brand,
    'Current Category': m.currentCategory,
    'Suggested Category': m.suggestedCategory,
    'Image Status': m.imageStatus,
  })));

  await writeFile('scratch/category_mismatch_report.json', JSON.stringify({
    totalScanned: products.length,
    totalMismatches: mismatches.length,
    breakdown,
    mismatches,
  }, null, 2));

  console.log('Saved report to scratch/category_mismatch_report.json');
}

main().catch(console.error).finally(() => prisma.$disconnect());
