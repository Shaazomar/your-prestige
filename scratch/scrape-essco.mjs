import {
  prisma, pool, fetchText, rehostImage, slugify, titleCase, ogTags,
  metaDescription, uniqueSlug, upsertProduct, Stats, decodeHtml,
} from './scrape-lib.mjs';
import fs from 'node:fs';

const BRAND_SLUG = 'essco';
const SITEMAP = 'https://www.esscobathware.com/sitemap.xml';

const FINISH_CODES = { WHT: 'White', CHR: 'Chrome', BLM: 'Matte Black', MBK: 'Matte Black', GLD: 'Gold', BLK: 'Black', AIS: 'Almond' };

const CATEGORY_WORDS = [
  ['faucet', 'Faucets'], ['mixer', 'Faucets'], ['tap', 'Faucets'], ['pillar', 'Faucets'],
  ['shower', 'Showers'], ['diverter', 'Showers'], ['health faucet', 'Showers'],
  ['heater', 'Water Heaters'], ['geyser', 'Water Heaters'],
  ['ewc', 'Sanitaryware'], ['wc', 'Sanitaryware'], ['basin', 'Sanitaryware'], ['urinal', 'Sanitaryware'], ['cistern', 'Sanitaryware'], ['closet', 'Sanitaryware'],
  ['accessor', 'Accessories'],
];
function inferCollectionType(text) {
  const t = text.toLowerCase();
  for (const [kw, label] of CATEGORY_WORDS) if (t.includes(kw)) return label;
  return 'Bath Fittings';
}

// Non-product marketing/blog pages that share the same sitemap (no per-URL
// type marker in the sitemap itself, so filter by obvious slug shape).
const SKIP_PATTERNS = [/^why-/, /^how-/, /^the-/, /blog/, /-guide$/, /^top-/, /^\d+-/];

async function main() {
  const stats = new Stats(BRAND_SLUG);
  const brand = await prisma.brand.findUnique({ where: { slug: BRAND_SLUG } });
  const sanitary = await prisma.category.findUnique({ where: { slug: 'sanitary' } });
  if (!brand || !sanitary) throw new Error('Run scratch/setup-catalog.mjs first');

  const xml = await fetchText(SITEMAP);
  // Sitemap entries are one per <url>...</url> block, each optionally carrying
  // an inline <image:image> with the product's own hero photo + caption.
  const blocks = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => m[1]);
  const entries = blocks.map((b) => {
    const loc = (b.match(/<loc>([^<]+)<\/loc>/) || [])[1];
    const img = (b.match(/<image:loc>([^<]+)<\/image:loc>/) || [])[1];
    const caption = (b.match(/<image:caption>([^<]*)<\/image:caption>/) || [])[1];
    return { loc, img, caption: decodeHtml(caption) };
  }).filter((e) => e.loc && e.loc.includes('/en-gb/'));

  const candidates = entries.filter((e) => {
    const slug = e.loc.split('/').filter(Boolean).pop();
    return !SKIP_PATTERNS.some((re) => re.test(slug)) && e.img; // require a real product photo
  });
  stats.discovered = candidates.length;
  console.log(`Essco: ${entries.length} sitemap URLs, ${candidates.length} product candidates`);

  const limit = Number(process.env.SCRAPE_LIMIT || 0);
  const runList = limit > 0 ? candidates.slice(0, limit) : candidates;

  await pool(runList, 8, async (entry) => {
    stats.processed++;
    const url = entry.loc;
    try {
      const html = await fetchText(url);
      const og = ogTags(html);
      if (og.type && og.type !== 'product') { stats.fail(url, `skipped: og:type=${og.type}`); return; }

      const slugSeg = url.split('/').filter(Boolean).pop();
      const sku = slugSeg.toUpperCase();
      const name = decodeHtml(og.title) || entry.caption || titleCase(slugSeg.replace(/-/g, ' '));
      const description = decodeHtml(og.description) || decodeHtml(metaDescription(html));
      const imageUrl = og.image || entry.img;
      if (!imageUrl) stats.noImage++;

      const finishCode = Object.keys(FINISH_CODES).find((c) => sku.split('-').includes(c));
      const finish = finishCode ? FINISH_CODES[finishCode] : null;
      const collection = inferCollectionType(`${name} ${sku}`);

      // Dimensions are sometimes given in the description, e.g. "Size: 360x475x395 mm".
      const sizeMatch = description && description.match(/(\d{2,4}\s?[xX]\s?\d{2,4}(?:\s?[xX]\s?\d{2,4})?\s?mm)/);
      const size = sizeMatch ? sizeMatch[1].replace(/\s+/g, '') : null;

      let hostedImage = null;
      if (imageUrl) {
        try { hostedImage = await rehostImage(imageUrl, `essco/${slugify(sku)}`, sku); stats.images++; }
        catch (e) { stats.fail(url, `image upload failed: ${e.message}`); }
      }

      const slug = await uniqueSlug(`essco-${sku}`);
      const importKey = `ESSCO__${sku}`;
      const { created } = await upsertProduct({
        importKey,
        data: {
          slug, name, brandId: brand.id, categoryId: sanitary.id,
          collection, description, finish, size, sku, productCode: sku,
          lifestyleImage: hostedImage, images: hostedImage ? [hostedImage] : [],
          published: true, status: 'ACTIVE',
          sourceWebsite: 'essco', sourceProductUrl: url, sourceImageUrl: imageUrl || null,
        },
      });
      if (created) stats.imported++; else { stats.updated++; stats.duplicates++; }
    } catch (e) {
      stats.fail(url, e.message);
    }
  });

  fs.writeFileSync('scratch/report-essco.json', JSON.stringify(stats.report(), null, 2));
  console.log(JSON.stringify(stats.report(), null, 2));
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
