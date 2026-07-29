/**
 * Seeds the bundled demo catalogue (src/lib/catalog.ts) into PostgreSQL.
 *
 * Run with Node's type stripping so the TypeScript source is the single source
 * of truth — copying the product data into this script would guarantee the two
 * drift apart:
 *
 *   node --experimental-strip-types scripts/seed-catalog.mjs
 *
 * Idempotent: upserts by slug, so re-running refreshes rows rather than
 * duplicating them, and never touches products created by a catalogue import.
 */
import { PrismaClient } from "@prisma/client";
import { products } from "../src/lib/catalog.ts";

const prisma = new PrismaClient();

const slugify = (s) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

async function main() {
  // — Categories: the three the public routes expect —
  const categoryMeta = {
    tiles: { name: "Tiles", description: "Marble, porcelain and ceramic surfaces.", sortOrder: 1 },
    sanitary: { name: "Sanitaryware", description: "Bathroom suites, faucets and wellness systems.", sortOrder: 2 },
    "designer-picks": { name: "Designer Picks", description: "Curated statements chosen by our consultants.", sortOrder: 3 },
  };

  const categoryIds = {};
  for (const [slug, meta] of Object.entries(categoryMeta)) {
    const row = await prisma.category.upsert({
      where: { slug },
      update: { name: meta.name, description: meta.description, sortOrder: meta.sortOrder, published: true },
      create: { slug, ...meta, published: true },
    });
    categoryIds[slug] = row.id;
  }

  // — Brands: whatever the catalogue references —
  const brandIds = {};
  const brandNames = [...new Set(products.map((p) => p.brand))].sort();
  for (const [i, name] of brandNames.entries()) {
    const row = await prisma.brand.upsert({
      where: { slug: slugify(name) },
      update: { name, published: true },
      create: { slug: slugify(name), name, published: true, sortOrder: i },
    });
    brandIds[name] = row.id;
  }

  // — Products —
  let created = 0;
  let updated = 0;
  for (const p of products) {
    const data = {
      name: p.name,
      collection: p.collection,
      description: p.description,
      finish: p.finish,
      thickness: p.thickness,
      sizes: p.sizes,
      color: p.color,
      texture: p.texture,
      applications: p.applications,
      lifestyleImage: p.lifestyleImage,
      textureImage: p.textureImage,
      images: p.gallery,
      tag: p.tag ?? null,
      aspect: p.aspect,
      featured: p.featured ?? false,
      designerPick: p.category === "designer-picks",
      published: true,
      categoryId: categoryIds[p.category],
      brandId: brandIds[p.brand],
    };

    const existing = await prisma.product.findUnique({ where: { slug: p.slug } });
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: data,
      create: { slug: p.slug, ...data },
    });
    if (existing) updated++;
    else created++;
  }

  const total = await prisma.product.count({ where: { deletedAt: null, published: true } });
  console.log(
    `Catalogue seeded — ${created} created, ${updated} updated, ${brandNames.length} brands, 3 categories.`
  );
  console.log(`Published products now live: ${total}`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
