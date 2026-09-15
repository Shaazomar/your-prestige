/**
 * LOCAL TEST FIXTURE ONLY — never run against production.
 *
 * Builds a ~5,500-product catalogue shaped like the real one (bathware brands
 * with Jaquar/Artize/Essco-style category trees, tile brands with GVT/PGVT/
 * slab structures) so the brand-first routes, queries and page timings can be
 * exercised at production scale.
 *
 * Refuses to run unless DATABASE_URL points at localhost.
 */
import { PrismaClient } from "@prisma/client";
import env from "@next/env";

env.loadEnvConfig(process.cwd());

const url = process.env.DATABASE_URL ?? "";
if (!/@(localhost|127\.0\.0\.1)[:/]/.test(url)) {
  console.error("Refusing to run: DATABASE_URL is not a localhost database.");
  console.error("This script is a local test fixture and must never touch production.");
  process.exit(1);
}

const prisma = new PrismaClient();
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

/** Deterministic PRNG so repeated runs produce the same catalogue. */
let seed = 42;
const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
const pick = (a) => a[Math.floor(rnd() * a.length)];
const maybe = (p) => rnd() < p;

const TAXONOMY = {
  Bathware: {
    Sanitaryware: ["Water Closets", "Wash Basins", "Urinals", "Cisterns"],
    Faucets: ["Basin Mixers", "Sink Mixers", "Bath Spouts", "Diverters & Shower Valves"],
    Showers: ["Overhead Showers", "Hand Showers", "Shower Enclosures", "Body Showers"],
    Bathtubs: ["Freestanding", "Built-in", "Whirlpool"],
    Wellness: ["Steam Rooms", "Saunas", "Spa Systems"],
    "Flushing Systems": ["Concealed Cisterns", "Flush Valves", "Actuator Plates"],
    Accessories: ["Towel Rails", "Robe Hooks", "Soap Dishes", "Mirrors"],
    "Water Heaters": ["Storage", "Instant"],
    "Allied Items": ["Waste Couplings", "Angular Stop Cocks"],
    Ceramics: ["Table Top Basins", "Under Counter Basins"],
  },
  Tiles: {
    "Floor Tiles": ["Vitrified", "Ceramic Floor", "Anti-Skid"],
    "Wall Tiles": ["Ceramic Wall", "Highlighter", "Subway"],
    GVT: ["Matt GVT", "Carving GVT", "Sugar GVT"],
    PGVT: ["Glossy PGVT", "Book Match PGVT"],
    "Full Body": ["Double Charge", "Salt & Pepper"],
    Slabs: ["Large Slabs", "Porcelain Slabs"],
    "Large Format": ["800x1600", "1200x2400"],
    Marble: ["Statuario", "Carrara", "Onyx"],
  },
};

/** Which top-level sections each brand sells in — mirrors real brand scope. */
const BRANDS = [
  { name: "Jaquar", section: "Bathware", desc: "Premium bathroom solutions — complete bath and wellness ranges.",
    categories: ["Sanitaryware", "Faucets", "Showers", "Bathtubs", "Wellness", "Flushing Systems", "Accessories", "Water Heaters"], weight: 1.0 },
  { name: "Artize", section: "Bathware", desc: "Luxury bath couture — sculpted faucets, showers and ceramics.",
    categories: ["Faucets", "Showers", "Ceramics", "Wellness", "Flushing Systems", "Accessories"], weight: 0.55 },
  { name: "Essco", section: "Bathware", desc: "Dependable everyday bathware for homes across India.",
    categories: ["Faucets", "Showers", "Sanitaryware", "Cisterns", "Allied Items", "Accessories", "Water Heaters"], weight: 0.7 },
  { name: "Motto", section: "Tiles", desc: "Engineered surfaces — GVT, PGVT and full-body porcelain.",
    categories: ["GVT", "PGVT", "Full Body", "Marble", "Slabs"], weight: 0.8 },
  { name: "Velzone", section: "Tiles", desc: "Contemporary floor and wall tiles for modern interiors.",
    categories: ["Floor Tiles", "Wall Tiles", "GVT", "PGVT", "Large Format", "Slabs", "Marble", "Full Body"], weight: 0.9 },
  { name: "Lonix", section: "Tiles", desc: "Large-format porcelain and marble-look surfaces.",
    categories: ["Floor Tiles", "Wall Tiles", "GVT", "PGVT", "Large Format", "Marble", "Slabs"], weight: 0.75 },
  // Deliberately included so nothing can assume "six brands".
  { name: "Somany", section: "Tiles", desc: "Established Indian tile maker with a broad surface range.",
    categories: ["Floor Tiles", "Wall Tiles", "GVT", "Full Body"], weight: 0.45 },
  { name: "Hindware", section: "Bathware", desc: "Sanitaryware and bath fittings for every budget.",
    categories: ["Sanitaryware", "Faucets", "Showers", "Accessories"], weight: 0.4 },
];

const COLLECTIONS = {
  Bathware: ["Kubix Prime", "Alive", "Opal Prime", "Continental", "Aria", "Serene", "Fonte", "Vignette", "Lyric", "Florentine"],
  Tiles: ["Dune", "Travertino", "Statuario Gold", "Urban Concrete", "Nordic Oak", "Calacatta", "Terrazzo", "Basalt Noir", "Sahara Beige", "Onyx Lumina"],
};

const SIZES = {
  Tiles: ["600x600", "600x1200", "800x1600", "1200x2400", "300x600", "200x1200"],
  Bathware: ["Standard", "Compact", "Wall Hung", "Floor Mounted"],
};
const FINISHES = {
  Tiles: ["Matt", "Glossy", "Carving", "Sugar", "Polished", "Rustic"],
  Bathware: ["Chrome", "Black Matt", "Gold Bright", "Stainless Steel", "Antique Bronze"],
};
const COLORS = ["White", "Beige", "Grey", "Ivory", "Black", "Brown", "Charcoal", "Sand"];

async function main() {
  console.log("Seeding local catalogue fixture…");

  // — Categories: two-level tree —
  const categoryId = new Map();
  for (const [section, children] of Object.entries(TAXONOMY)) {
    const parent = await prisma.category.upsert({
      where: { slug: slugify(section) },
      update: {},
      create: { slug: slugify(section), name: section, published: true },
    });
    categoryId.set(section, parent.id);

    for (const [child, grandchildren] of Object.entries(children)) {
      const c = await prisma.category.upsert({
        where: { slug: slugify(child) },
        update: { parentId: parent.id },
        create: { slug: slugify(child), name: child, parentId: parent.id, published: true },
      });
      categoryId.set(`${section}/${child}`, c.id);

      for (const gc of grandchildren) {
        const g = await prisma.category.upsert({
          where: { slug: slugify(`${child}-${gc}`) },
          update: { parentId: c.id },
          create: { slug: slugify(`${child}-${gc}`), name: gc, parentId: c.id, published: true },
        });
        categoryId.set(`${section}/${child}/${gc}`, g.id);
      }
    }
  }
  console.log(`  categories: ${categoryId.size}`);

  // — Collections —
  const collectionId = new Map();
  for (const [section, names] of Object.entries(COLLECTIONS)) {
    for (const n of names) {
      const c = await prisma.collection.upsert({
        where: { slug: slugify(n) },
        update: {},
        create: { slug: slugify(n), name: n, published: true },
      });
      collectionId.set(`${section}/${n}`, c.id);
    }
  }

  // — Brands —
  const brandRows = new Map();
  for (const b of BRANDS) {
    const row = await prisma.brand.upsert({
      where: { slug: slugify(b.name) },
      update: { description: b.desc, published: true },
      create: { slug: slugify(b.name), name: b.name, description: b.desc, published: true },
    });
    brandRows.set(b.name, row);
  }
  console.log(`  brands: ${brandRows.size}`);

  // — Products —
  const TARGET = 5500;
  const totalWeight = BRANDS.reduce((s, b) => s + b.weight, 0);
  let made = 0;
  const batch = [];

  for (const b of BRANDS) {
    const brand = brandRows.get(b.name);
    const count = Math.round((b.weight / totalWeight) * TARGET);

    for (let i = 0; i < count; i++) {
      const cat = pick(b.categories);
      const subs = TAXONOMY[b.section][cat] ?? [];
      const sub = subs.length && maybe(0.75) ? pick(subs) : null;
      const leafKey = sub ? `${b.section}/${cat}/${sub}` : `${b.section}/${cat}`;
      const leafId = categoryId.get(leafKey) ?? categoryId.get(`${b.section}/${cat}`);

      const collName = pick(COLLECTIONS[b.section]);
      const size = pick(SIZES[b.section]);
      const finish = pick(FINISHES[b.section]);
      const color = pick(COLORS);
      const name = `${collName} ${sub ?? cat} ${size} ${finish}`;
      const slug = slugify(`${b.name}-${name}-${i}`);

      // ~6% arrive with no category at all, the way a raw import does — these
      // are what the classifier and the CMS review queue have to deal with.
      const unclassified = maybe(0.06);

      batch.push({
        slug,
        name,
        brandId: brand.id,
        categoryId: unclassified ? null : leafId,
        collectionId: collectionId.get(`${b.section}/${collName}`) ?? null,
        collection: collName,
        sku: `${b.name.slice(0, 3).toUpperCase()}-${String(made + 1).padStart(5, "0")}`,
        productCode: `${b.name.slice(0, 2).toUpperCase()}${1000 + i}`,
        size,
        sizes: [size],
        finish,
        surface: finish,
        color,
        material: b.section === "Tiles" ? "Porcelain" : "Brass",
        published: true,
        featured: maybe(0.02),
        classification: "UNCLASSIFIED",
        // Imagery arrives as an S3 object key, exactly like the depot import.
        image_key: `catalog/${slugify(b.name)}/${slug}.webp`,
      });
      made++;

      if (batch.length >= 500) {
        await prisma.product.createMany({ data: batch, skipDuplicates: true });
        batch.length = 0;
        process.stdout.write(`  products: ${made}\r`);
      }
    }
  }
  if (batch.length) await prisma.product.createMany({ data: batch, skipDuplicates: true });
  console.log(`  products: ${made}          `);

  // — Variants on a slice of products —
  const sample = await prisma.product.findMany({
    where: { brandId: { not: null } },
    select: { id: true, size: true, finish: true, color: true, sku: true },
    take: 900,
  });
  const variants = [];
  for (const p of sample) {
    const n = 1 + Math.floor(rnd() * 3);
    for (let v = 0; v < n; v++) {
      variants.push({
        productId: p.id,
        sku: `${p.sku}-V${v + 1}`,
        name: `${p.size ?? "Standard"} ${p.finish ?? ""}`.trim(),
        size: p.size,
        finish: p.finish,
        color: p.color,
        sortOrder: v,
        active: true,
      });
    }
  }
  for (let i = 0; i < variants.length; i += 500) {
    await prisma.productVariant.createMany({ data: variants.slice(i, i + 500), skipDuplicates: true });
  }
  console.log(`  variants: ${variants.length}`);

  const [products, brands, categories, vcount, inventory] = await Promise.all([
    prisma.product.count(),
    prisma.brand.count(),
    prisma.category.count(),
    prisma.productVariant.count(),
    prisma.inventory.count(),
  ]);
  console.log({ products, brands, categories, variants: vcount, inventoryRows: inventory });
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
