import {
  prisma, pool, fetchText, rehostImage, slugify, titleCase, ogTags,
  metaDescription, uniqueSlug, upsertProduct, Stats, decodeHtml, firstMatch,
} from './scrape-lib.mjs';
import fs from 'node:fs';

const BRAND_SLUG = 'jaquar';

const CATEGORY_WORDS = [
  ['faucet', 'Faucets'], ['mixer', 'Faucets'], ['tap', 'Faucets'], ['spout', 'Faucets'], ['diverter', 'Faucets'],
  ['shower', 'Showers'], ['rain', 'Showers'], ['overhead', 'Showers'], ['hand shower', 'Showers'],
  ['whirlpool', 'Wellness'], ['bathtub', 'Wellness'], ['sauna', 'Wellness'], ['steam', 'Wellness'], ['spa', 'Wellness'],
  ['wc ', 'Sanitaryware'], ['water closet', 'Sanitaryware'], ['basin', 'Sanitaryware'], ['urinal', 'Sanitaryware'], ['cistern', 'Sanitaryware'], ['flush', 'Flushing Systems'],
  ['light', 'Lighting'], ['lamp', 'Lighting'], ['chandelier', 'Lighting'],
  ['enclosure', 'Shower Enclosures'], ['panel', 'Shower Panels'],
  ['accessor', 'Accessories'], ['heater', 'Water Heaters'], ['geyser', 'Water Heaters'],
];
function inferCollectionType(text) {
  const t = text.toLowerCase();
  for (const [kw, label] of CATEGORY_WORDS) if (t.includes(kw)) return label;
  return 'Bath Fittings';
}

async function main() {
  const stats = new Stats(BRAND_SLUG);
  const brand = await prisma.brand.findUnique({ where: { slug: BRAND_SLUG } });
  const sanitary = await prisma.category.findUnique({ where: { slug: 'sanitary' } });
  if (!brand || !sanitary) throw new Error('Run scratch/setup-catalog.mjs first');

  // RETRY_FAILED_FROM lets a second pass re-check only the URLs a prior run
  // logged as failed (almost all transient network/DB-pool errors from
  // running two scrapers at once, not real "not a product" pages) instead of
  // re-walking the whole sitemap.
  const retryFile = process.env.RETRY_FAILED_FROM;
  const candidates = retryFile
    ? JSON.parse(fs.readFileSync(retryFile, 'utf8')).failed.map((f) => f.url)
    : JSON.parse(fs.readFileSync('scratch/jaquar_candidates.json', 'utf8'));
  stats.discovered = candidates.length;
  console.log(`Jaquar: ${candidates.length} candidate URLs to check${retryFile ? ' (retry pass)' : ''}`);

  const limit = Number(process.env.SCRAPE_LIMIT || 0);
  const runList = limit > 0 ? candidates.slice(0, limit) : candidates;
  let notProduct = 0;
  let checkpoint = 0;

  await pool(runList, 12, async (url) => {
    stats.processed++;
    try {
      const html = await fetchText(url, { retries: 2, timeoutMs: 15000 });
      const og = ogTags(html);
      // The site's real product-page template always sets og:type=product and
      // renders a `<span id="sku-N">CODE</span>` — this is what actually
      // distinguishes a product page from the ~500 blog/category/article
      // pages that share the same flat /en/<slug> URL space.
      const sku = firstMatch(html, /id="sku-\d+"[^>]*>\s*([A-Z0-9][A-Z0-9.\-]{3,40})\s*</);
      if (og.type !== 'product' || !sku) { notProduct++; return; }

      const name = decodeHtml(og.title) || titleCase(url.split('/').pop().replace(/-/g, ' '));
      const description = decodeHtml(og.description) || decodeHtml(metaDescription(html));
      const imageUrl = og.image || null;
      if (!imageUrl) stats.noImage++;

      const collection = inferCollectionType(`${name} ${description || ''} ${sku}`);
      const sizeMatch = description && description.match(/(\d{2,4}\s?[xX]\s?\d{2,4}(?:\s?[xX]\s?\d{2,4})?\s?mm)/);
      const size = sizeMatch ? sizeMatch[1].replace(/\s+/g, '') : null;

      let hostedImage = null;
      if (imageUrl) {
        try { hostedImage = await rehostImage(imageUrl, `jaquar/${slugify(sku)}`, sku); stats.images++; }
        catch (e) { stats.fail(url, `image upload failed: ${e.message}`); }
      }

      const slug = await uniqueSlug(`jaquar-${sku}`);
      const importKey = `JAQUAR__${sku}`;
      const { created } = await upsertProduct({
        importKey,
        data: {
          slug, name, brandId: brand.id, categoryId: sanitary.id,
          collection, description, size, sku, productCode: sku,
          lifestyleImage: hostedImage, images: hostedImage ? [hostedImage] : [],
          published: true, status: 'ACTIVE',
          sourceWebsite: 'jaquar', sourceProductUrl: url, sourceImageUrl: imageUrl || null,
        },
      });
      if (created) stats.imported++; else { stats.updated++; stats.duplicates++; }
    } catch (e) {
      stats.fail(url, e.message);
    } finally {
      checkpoint++;
      if (checkpoint % 250 === 0) {
        console.log(`...${checkpoint}/${runList.length} checked, ${stats.imported + stats.updated} products so far, ${notProduct} non-product pages skipped`);
        fs.writeFileSync('scratch/report-jaquar.json', JSON.stringify(stats.report(), null, 2));
      }
    }
  });

  const r = stats.report();
  r.nonProductPagesSkipped = notProduct;
  const outFile = retryFile ? 'scratch/report-jaquar-retry.json' : 'scratch/report-jaquar.json';
  fs.writeFileSync(outFile, JSON.stringify(r, null, 2));
  console.log(JSON.stringify(r, null, 2));
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
