/**
 * Load a production-faithful catalogue into a LOCAL database.
 *
 * Why this exists
 * ---------------
 * The live catalogue lives in a shared Neon Postgres that also backs
 * prestige-inv (the ERP). A development container has no credentials for it,
 * and it must never be written to from here anyway — so there was no way to
 * run, develop against or test the catalogue surfaces at realistic scale.
 * `scripts/seed.mjs` seeds two demo products against demo brands (Somany,
 * Kajaria, Grohe), which is not the real catalogue and not the real brands.
 *
 * `scratch/product_image_audit_report.csv` is a snapshot of the live
 * catalogue taken during the image-recovery pass: 6,215 rows carrying the
 * real product name, brand, SKU, category and the S3 image URL each product
 * resolved to, plus whether it ended up published or held back. That is
 * enough to rebuild a faithful local replica — same brands, same category
 * mix, same scale, and image URLs that genuinely load, because the objects
 * are public in the media bucket.
 *
 * This writes ONLY to whatever DATABASE_URL points at. It is a development
 * fixture loader: point it at the shared database and it would duplicate
 * catalogue rows, so it refuses to run against a non-local host unless
 * ALLOW_REMOTE=1 is set explicitly.
 *
 * It touches no depot/ERP table — not Inventory, InventoryMovement,
 * StockBlock, Warehouse or Supplier. Catalogue rows only.
 *
 *   DATABASE_URL=postgresql://...localhost... node scripts/load-catalog-fixture.mjs
 */
import { PrismaClient } from "@prisma/client";
import { createReadStream } from "fs";
import { createInterface } from "readline";
import path from "path";

const CSV = path.join(process.cwd(), "scratch/product_image_audit_report.csv");
const prisma = new PrismaClient();

/** Guard: this script inserts thousands of rows and is for local work only. */
function assertLocal() {
  const url = process.env.DATABASE_URL || "";
  const local = /@(127\.0\.0\.1|localhost|\[::1\])[:/]/.test(url);
  if (!local && process.env.ALLOW_REMOTE !== "1") {
    console.error(
      "Refusing to run: DATABASE_URL is not a local host.\n" +
        "This loader inserts a full catalogue copy and must never run against\n" +
        "the shared production database. Set ALLOW_REMOTE=1 only if you are\n" +
        "certain, e.g. for a disposable staging instance."
    );
    process.exit(1);
  }
}

/** Minimal RFC4180 line parser — fields here are quoted and contain commas. */
function parseCsvLine(line) {
  const out = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (quoted) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else quoted = false;
      } else cur += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      out.push(cur);
      cur = "";
    } else cur += c;
  }
  out.push(cur);
  return out;
}

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/**
 * Category tree. `resolveCategory` in src/lib/products.ts decides a product's
 * public section by walking its whole ancestry looking for a `tiles` or
 * `bathware`/`sanitary` root, so these parents are what put each product in
 * the right section, breadcrumb and canonical URL. "Bathware" matches what
 * the live tree uses (see parentCategory in scratch/audit_results_full.json).
 */
const TILE_CATEGORIES = new Set(["Tiles"]);
const CATEGORY_ICONS = {
  Faucets: "droplet",
  Showers: "shower-head",
  "Bath Fittings": "wrench",
  Lighting: "lightbulb",
  Sanitaryware: "toilet",
  Tiles: "grid",
  Accessories: "package",
  Wellness: "sparkles",
  "Water Heaters": "flame",
  "Flushing Systems": "waves",
  "Shower Enclosures": "square",
};

async function ensureRoots() {
  const roots = {};
  for (const [slug, name, sortOrder] of [
    ["tiles", "Tiles", 1],
    ["bathware", "Bathware", 2],
  ]) {
    roots[slug] = await prisma.category.upsert({
      where: { slug },
      create: { slug, name, sortOrder, published: true },
      update: {},
    });
  }
  return roots;
}

async function main() {
  assertLocal();

  const rl = createInterface({ input: createReadStream(CSV), crlfDelay: Infinity });
  const rows = [];
  let header = null;
  for await (const line of rl) {
    if (!line.trim()) continue;
    const cells = parseCsvLine(line);
    if (!header) {
      header = cells;
      continue;
    }
    rows.push(Object.fromEntries(header.map((h, i) => [h, cells[i] ?? ""])));
  }
  console.log(`Read ${rows.length} catalogue rows from the snapshot.`);

  const roots = await ensureRoots();

  // ————— Brands —————
  const brandNames = [...new Set(rows.map((r) => r.Brand).filter(Boolean))];
  const brands = {};
  for (const name of brandNames) {
    const slug = slugify(name);
    brands[name] = await prisma.brand.upsert({
      where: { slug },
      create: { slug, name, published: true, description: `${name} products available at Prestige Tiles & Sanitary.` },
      update: {},
    });
  }
  console.log(`Brands ready: ${brandNames.join(", ")}`);

  // ————— Categories —————
  const catNames = [...new Set(rows.map((r) => r.Category).filter(Boolean))];
  const cats = {};
  let order = 1;
  for (const name of catNames) {
    const slug = slugify(name);
    const parentId = TILE_CATEGORIES.has(name) ? roots.tiles.id : roots.bathware.id;
    cats[name] = await prisma.category.upsert({
      where: { slug },
      create: { slug, name, parentId, sortOrder: order++, published: true, icon: CATEGORY_ICONS[name] ?? null },
      update: { parentId },
    });
  }
  console.log(`Categories ready under tiles/bathware: ${catNames.join(", ")}`);

  // ————— Products —————
  // Slugs must be unique. The snapshot has repeated product names across
  // SKUs (five different "2 Way Bib Cock" rows), so the SKU disambiguates —
  // which is also how the live slugs were built (jaquar-akl-wht-...).
  let created = 0;
  let skipped = 0;
  let dupSku = 0;
  const seen = new Set();
  // `Product.sku` is @unique, but the snapshot genuinely repeats SKUs — the
  // scrape reports logged 314 duplicate Motto rows and 44 duplicate Jaquar
  // rows against the same codes. The first row to claim a code keeps it;
  // later rows keep the code in `productCode` (not unique) so nothing is
  // lost and the duplication stays visible in the data.
  const claimedSku = new Set();

  for (const r of rows) {
    const name = r.Product?.trim();
    const brand = brands[r.Brand];
    const cat = cats[r.Category];
    const image = r["New Image"]?.trim() || null;
    if (!name || !brand) {
      skipped++;
      continue;
    }

    const base = slugify(`${r.Brand}-${r.SKU || name}`);
    let slug = base;
    let n = 2;
    while (seen.has(slug)) slug = `${base}-${n++}`;
    seen.add(slug);

    // The snapshot's own verdict is honoured rather than overridden: the 75
    // rows it held back had no verified photography, and the rule in the
    // brief is that such a product stays unpublished until its image is
    // confirmed. Those rows carry needsReview so they surface in the admin
    // review queue instead of silently sitting as drafts.
    const published = r["Final Visibility"] === "PUBLISHED" && !!image;

    const code = r.SKU?.trim() || null;
    let sku = code;
    if (sku) {
      if (claimedSku.has(sku)) {
        sku = null;
        dupSku++;
      } else claimedSku.add(sku);
    }

    await prisma.product.create({
      data: {
        slug,
        name,
        sku,
        productCode: code,
        brandId: brand.id,
        categoryId: cat?.id ?? null,
        lifestyleImage: image,
        sourceImageUrl: r["Old Image"]?.trim() || null,
        sourceWebsite: slugify(r.Brand || ""),
        published,
        status: published ? "ACTIVE" : "DRAFT",
        needsReview: !published,
        reviewReason: published
          ? null
          : "Awaiting verified product photography — held back from the public catalogue.",
      },
    });
    created++;
    if (created % 1000 === 0) console.log(`  …${created} products`);
  }

  console.log(`\nCreated ${created} products (${skipped} skipped, ${dupSku} with a duplicate SKU kept as productCode only).`);

  const [total, live, draft] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { published: true, status: "ACTIVE", deletedAt: null } }),
    prisma.product.count({ where: { status: "DRAFT" } }),
  ]);
  console.table({ totalProducts: total, publiclyVisible: live, draftOrHeldBack: draft });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
