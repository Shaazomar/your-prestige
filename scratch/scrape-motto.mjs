import {
  prisma, pool, fetchText, rehostImage, slugify, titleCase, uniqueSlug,
  upsertProduct, Stats, decodeHtml, firstMatch,
} from './scrape-lib.mjs';
import fs from 'node:fs';

const BRAND_SLUG = 'motto';
const BASE = 'https://www.mottogroup.in/';

function abs(path) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return BASE + path.replace(/^\/+/, '');
}

async function main() {
  const stats = new Stats(BRAND_SLUG);
  const brand = await prisma.brand.findUnique({ where: { slug: BRAND_SLUG } });
  const tiles = await prisma.category.findUnique({ where: { slug: 'tiles' } });
  if (!brand || !tiles) throw new Error('Run scratch/setup-catalog.mjs first');

  const home = await fetchText(BASE);
  const sizePages = [...new Set(
    [...home.matchAll(/href="(product\.php\?sid=\d+&name=[^"]+)"/g)].map((m) => abs(decodeHtml(m[1])))
  )];
  console.log(`Motto: ${sizePages.length} size-category pages`);

  // Crawl each size page for product-detail links, de-duplicated by pid.
  const productLinksByPid = new Map();
  await pool(sizePages, 5, async (pageUrl) => {
    try {
      const html = await fetchText(pageUrl);
      for (const m of html.matchAll(/href="(product-detail\.php\?[^"]+)"/g)) {
        const href = decodeHtml(m[1]);
        const url = abs(href);
        const pid = firstMatch(url, /[?&]pid=(\d+)/);
        if (pid && !productLinksByPid.has(pid)) productLinksByPid.set(pid, url);
      }
    } catch (e) {
      stats.fail(pageUrl, `category page failed: ${e.message}`);
    }
  });

  const productUrls = [...productLinksByPid.values()];
  stats.discovered = productUrls.length;
  console.log(`Motto: ${productUrls.length} distinct products discovered`);

  const limit = Number(process.env.SCRAPE_LIMIT || 0);
  const runList = limit > 0 ? productUrls.slice(0, limit) : productUrls;

  await pool(runList, 6, async (url) => {
    stats.processed++;
    try {
      const html = await fetchText(url);
      const pid = firstMatch(url, /[?&]pid=(\d+)/);
      const pname = decodeURIComponent(firstMatch(url, /[?&]pname=([^&]+)/) || '');
      const h1 = decodeHtml(firstMatch(html, /<h1[^>]*>([^<]+)<\/h1>/i)) || pname.replace(/-/g, ' ');
      const name = titleCase(h1);

      // Design/colour split, e.g. "OMEGA-BLACK" -> collection "Omega", color "Black".
      const parts = pname.split('-');
      const color = parts.length > 1 ? titleCase(parts[parts.length - 1]) : null;
      const collection = titleCase(parts.length > 1 ? parts.slice(0, -1).join(' ') : pname);

      const material = firstMatch(html, /Collection<\/th>\s*<td>([^<]+)<\/td>/i);
      const size = firstMatch(html, /Size\s*<\/th>\s*<td>([^<]+)<\/td>/i);
      const finish = firstMatch(html, /Finish\s*<\/th>\s*<td>([^<]+)<\/td>/i);

      const imgMatch = html.match(/data-fancybox="gallery"\s+href="(uploads\/products\/[^"]+)"/i)
        || html.match(/src="(uploads\/products\/[^"]+)"/i);
      const imageUrl = imgMatch ? abs(decodeHtml(imgMatch[1])) : null;
      if (!imageUrl) stats.noImage++;

      let hostedImage = null;
      if (imageUrl) {
        try { hostedImage = await rehostImage(imageUrl, `motto/${slugify(pname)}`, pname); stats.images++; }
        catch (e) { stats.fail(url, `image upload failed: ${e.message}`); }
      }

      // Include pid in the slug base, not just pname: the same design name
      // legitimately recurs across different size categories with a
      // different pid each time, and two such items can be mid-flight
      // concurrently — basing the slug on pname alone raced two workers into
      // computing the same "not taken yet" slug before either had inserted.
      const slug = await uniqueSlug(`motto-${pname}-${pid}`);
      const importKey = `MOTTO__${pid}`;
      const { created } = await upsertProduct({
        importKey,
        data: {
          slug, name, brandId: brand.id, categoryId: tiles.id,
          collection, color, size: size || null, finish: finish || null, material: material || null,
          productCode: pname,
          lifestyleImage: hostedImage, images: hostedImage ? [hostedImage] : [],
          published: true, status: 'ACTIVE',
          sourceWebsite: 'motto', sourceProductUrl: url, sourceImageUrl: imageUrl || null,
        },
      });
      if (created) stats.imported++; else { stats.updated++; stats.duplicates++; }
    } catch (e) {
      stats.fail(url, e.message);
    }
  });

  fs.writeFileSync('scratch/report-motto.json', JSON.stringify(stats.report(), null, 2));
  console.log(JSON.stringify(stats.report(), null, 2));
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
