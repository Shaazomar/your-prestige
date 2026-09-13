import {
  prisma, rehostImage, slugify, titleCase, uniqueSlug, upsertProduct, Stats,
  decodeHtml, fetchText, pool,
} from './scrape-lib.mjs';
import fs from 'node:fs';

const BRAND_SLUG = 'velzone';
const BASE = 'https://velzonegranito.com/';
const PAGE = BASE + 'Products.html';

async function main() {
  const stats = new Stats(BRAND_SLUG);
  const brand = await prisma.brand.findUnique({ where: { slug: BRAND_SLUG } });
  const tiles = await prisma.category.findUnique({ where: { slug: 'tiles' } });
  if (!brand || !tiles) throw new Error('Run scratch/setup-catalog.mjs first');

  let html = await fetchText(PAGE);
  // Strip out commented-out alternate-angle product cards (R2/R3/R4 variants
  // the site keeps in HTML comments but doesn't actually display) so they
  // aren't mistaken for live products. Section markers like
  // "<!-- xxxxx 600x1200 Glossy GVT Collection Start xxxxx -->" are kept —
  // they don't wrap a <div> so this pattern doesn't touch them.
  html = html.replace(/<!--\s*<div[\s\S]*?-->/g, '');

  // Walk the document once, tracking the most recent "SIZE FINISH MATERIAL
  // Collection Start" marker and attaching it to every live product card
  // found until the next marker.
  const tokenRe = /<!--\s*xxxxx\s*(\d+[xX]\d+)\s+(.+?)\s+(GVT|PGVT|DGVT)\s+Collection Start\s*xxxxx\s*-->|<div class="col-xl-2[^"]*\bproducts\b[^"]*">[\s\S]*?<img[^>]*class="velzone-product-shadow"[^>]*src="([^"]+)"[\s\S]*?<h4 class="velzone-product-name">([^<]+)<\/h4>/g;

  let currentSize = null, currentFinish = null, currentMaterial = null;
  const products = [];
  for (const m of html.matchAll(tokenRe)) {
    if (m[1]) { // section marker
      currentSize = m[1].toUpperCase();
      currentFinish = titleCase(m[2].trim());
      currentMaterial = m[3];
    } else { // product card
      const imgRel = decodeHtml(m[4]);
      const name = titleCase(decodeHtml(m[5]).trim());
      products.push({ name, imgRel, size: currentSize, finish: currentFinish, material: currentMaterial });
    }
  }
  // The same design can legitimately appear in more than one size/finish
  // section — that's a real variant, not a duplicate — so key on all three.
  const seen = new Set();
  const unique = products.filter((p) => {
    const key = `${p.name}__${p.size}__${p.finish}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  stats.discovered = unique.length;
  console.log(`Velzone: ${products.length} product cards found on page, ${unique.length} unique (name+size+finish)`);

  const limit = Number(process.env.SCRAPE_LIMIT || 0);
  const runList = limit > 0 ? unique.slice(0, limit) : unique;

  await pool(runList, 6, async (p) => {
    stats.processed++;
    const imageUrl = BASE + p.imgRel.replace(/^\/+/, '');
    try {
      let hostedImage = null;
      const codeBase = `${p.name}-${p.size}-${p.finish}`;
      try { hostedImage = await rehostImage(imageUrl, `velzone/${slugify(codeBase)}`, codeBase); stats.images++; }
      catch (e) { stats.fail(imageUrl, `image upload failed: ${e.message}`); }
      if (!hostedImage) stats.noImage++;

      const productCode = slugify(codeBase).toUpperCase().replace(/-/g, '');
      const slug = await uniqueSlug(`velzone-${codeBase}`);
      const importKey = `VELZONE__${productCode}`;
      const { created } = await upsertProduct({
        importKey,
        data: {
          slug, name: p.name, brandId: brand.id, categoryId: tiles.id,
          collection: p.name, size: p.size, finish: p.finish, material: p.material,
          productCode,
          lifestyleImage: hostedImage, images: hostedImage ? [hostedImage] : [],
          published: true, status: 'ACTIVE',
          sourceWebsite: 'velzone', sourceProductUrl: PAGE, sourceImageUrl: imageUrl,
        },
      });
      if (created) stats.imported++; else { stats.updated++; stats.duplicates++; }
    } catch (e) {
      stats.fail(imageUrl, e.message);
    }
  });

  fs.writeFileSync('scratch/report-velzone.json', JSON.stringify(stats.report(), null, 2));
  console.log(JSON.stringify(stats.report(), null, 2));
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
