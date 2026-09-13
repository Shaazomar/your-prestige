import {
  prisma, pool, fetchText, rehostImage, slugify, titleCase, ogTags,
  metaDescription, uniqueSlug, upsertProduct, Stats, decodeHtml,
} from './scrape-lib.mjs';
import fs from 'node:fs';

const BRAND_SLUG = 'artize';
const SITEMAP_PRODUCTS = 'https://www.artize.com/in/sitemap-products.xml';
const SITEMAP_CATEGORIES = 'https://www.artize.com/in/sitemap-categories.xml';

// Common chrome/finish codes used in Indian sanitaryware SKUs (manufacturer's
// own coding convention — not invented). Left null when the code isn't one
// of these well-established ones rather than guessing.
const FINISH_CODES = { CHR: 'Chrome', WHT: 'White', BLM: 'Matte Black', MBK: 'Matte Black', GLD: 'Gold', BRZ: 'Bronze', BLK: 'Black' };

const CATEGORY_WORDS = [
  ['faucet', 'Faucets'], ['mixer', 'Faucets'], ['tap', 'Faucets'], ['spout', 'Faucets'], ['flush', 'Flushing System'],
  ['shower', 'Showers'], ['rain', 'Showers'], ['diverter', 'Showers'],
  ['whirlpool', 'Wellness'], ['bathtub', 'Wellness'], ['sauna', 'Wellness'], ['steam', 'Wellness'], ['spa', 'Wellness'],
  ['basin', 'Sanitaryware'], ['wc', 'Sanitaryware'], ['closet', 'Sanitaryware'], ['urinal', 'Sanitaryware'], ['cistern', 'Sanitaryware'],
  ['accessor', 'Accessories'],
];

function inferCollectionType(text) {
  const t = text.toLowerCase();
  for (const [kw, label] of CATEGORY_WORDS) if (t.includes(kw)) return label;
  return 'Bath Fittings';
}

function extractOgAll(html) {
  // og:type=product only shows up on the second, page-specific meta block on
  // these OpenCart sites — ogTags() already keeps the last occurrence.
  return ogTags(html);
}

async function main() {
  const stats = new Stats(BRAND_SLUG);
  const brand = await prisma.brand.findUnique({ where: { slug: BRAND_SLUG } });
  const sanitary = await prisma.category.findUnique({ where: { slug: 'sanitary' } });
  if (!brand || !sanitary) throw new Error('Run scratch/setup-catalog.mjs first');

  const [productsXml, categoriesXml] = await Promise.all([
    fetchText(SITEMAP_PRODUCTS), fetchText(SITEMAP_CATEGORIES),
  ]);
  const productUrls = [...productsXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const categorySlugs = [...categoriesXml.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((m) => m[1].split('/').filter(Boolean).pop())
    .filter((s) => s && s.length > 2);
  stats.discovered = productUrls.length;
  console.log(`Artize: ${productUrls.length} product URLs discovered`);
  const limit = Number(process.env.SCRAPE_LIMIT || 0);
  const runUrls = limit > 0 ? productUrls.slice(0, limit) : productUrls;

  await pool(runUrls, 8, async (url) => {
    stats.processed++;
    try {
      const html = await fetchText(url);
      const og = extractOgAll(html);
      const slugSeg = url.split('/').filter(Boolean).pop();
      const sku = slugSeg.toUpperCase();

      let name = decodeHtml(og.title) || titleCase(slugSeg.replace(/-/g, ' '));
      // Prefix with the matched collection name when the URL is under one
      // (e.g. "navia-basin-mixer" -> collection "Navia") and the title doesn't
      // already mention it, so "Basin Mixer" reads as "Navia Basin Mixer".
      const matchedCollectionSlug = categorySlugs
        .map((c) => c.replace(/-\d+$/, ''))
        .filter((c) => c.length > 3)
        .find((c) => slugSeg.startsWith(c + '-') || slugSeg === c);
      const collectionName = matchedCollectionSlug ? titleCase(matchedCollectionSlug.replace(/-/g, ' ')) : null;
      if (collectionName && !name.toLowerCase().includes(collectionName.toLowerCase())) {
        name = `${collectionName} ${name}`;
      }

      const description = decodeHtml(og.description) || decodeHtml(metaDescription(html));
      let imageUrl = og.image;
      if (!imageUrl || imageUrl.includes('metatags.io')) {
        const m = html.match(/<img[^>]*class="[^"]*product-main[^"]*"[^>]*src="([^"]+)"/i) || html.match(/<img[^>]*id="main-image"[^>]*src="([^"]+)"/i);
        imageUrl = m ? m[1] : null;
      }
      if (!imageUrl) { stats.noImage++; }

      const finishCode = Object.keys(FINISH_CODES).find((c) => sku.split('-').includes(c));
      const finish = finishCode ? FINISH_CODES[finishCode] : null;

      const collection = collectionName || inferCollectionType(`${name} ${sku}`);

      let hostedImage = null;
      if (imageUrl) {
        try {
          hostedImage = await rehostImage(imageUrl, `artize/${slugify(sku)}`, sku);
          stats.images++;
        } catch (e) {
          stats.fail(url, `image upload failed: ${e.message}`);
        }
      }

      const slug = await uniqueSlug(`artize-${sku}`);
      const importKey = `ARTIZE__${sku}`;

      const { created } = await upsertProduct({
        importKey,
        data: {
          slug, name, brandId: brand.id, categoryId: sanitary.id,
          collection, description, finish, sku, productCode: sku,
          lifestyleImage: hostedImage, images: hostedImage ? [hostedImage] : [],
          published: true, status: 'ACTIVE',
          sourceWebsite: 'artize', sourceProductUrl: url, sourceImageUrl: imageUrl || null,
        },
      });
      if (created) stats.imported++; else { stats.updated++; stats.duplicates++; }
    } catch (e) {
      stats.fail(url, e.message);
    }
  });

  fs.writeFileSync('scratch/report-artize.json', JSON.stringify(stats.report(), null, 2));
  console.log(JSON.stringify(stats.report(), null, 2));
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
