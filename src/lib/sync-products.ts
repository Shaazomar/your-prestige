import { prisma } from "@/lib/prisma";
import { products as catalogProducts } from "@/lib/catalog";

export interface SyncReport {
  existingProductsCount: number;
  matchedProductsCount: number;
  updatedProductsCount: number;
  newProductsCount: number;
  duplicateProductsCount: number;
  missingDataCount: number;
  failedRecordsCount: number;
  details: string[];
}

export async function syncCatalogProductsToDb(): Promise<SyncReport> {
  const report: SyncReport = {
    existingProductsCount: 0,
    matchedProductsCount: 0,
    updatedProductsCount: 0,
    newProductsCount: 0,
    duplicateProductsCount: 0,
    missingDataCount: 0,
    failedRecordsCount: 0,
    details: [],
  };

  try {
    const existingDbProducts = await prisma.product.findMany({
      select: { id: true, slug: true, sku: true, name: true },
    });
    report.existingProductsCount = existingDbProducts.length;

    // 1. Ensure Top-level Categories exist
    const categoryMap: Record<string, string> = {};
    const categoriesToCreate = [
      { slug: "tiles", name: "Tiles", description: "Italian marble, large-format porcelain & vitrified tiles" },
      { slug: "sanitary", name: "Sanitaryware", description: "Sculptural tubs, rain showers, basins & luxury bath fittings" },
      { slug: "designer-picks", name: "Designer Picks", description: "Hand-selected statements curated by design consultants" },
    ];

    for (const cat of categoriesToCreate) {
      const dbCat = await prisma.category.upsert({
        where: { slug: cat.slug },
        update: { name: cat.name, description: cat.description },
        create: { slug: cat.slug, name: cat.name, description: cat.description, published: true },
      });
      categoryMap[cat.slug] = dbCat.id;
    }

    // 2. Ensure Collections exist
    const collectionMap: Record<string, string> = {};
    const collectionsToEnsure = Array.from(new Set(catalogProducts.map((p) => p.collection)));
    for (const colName of collectionsToEnsure) {
      const slug = colName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const dbCol = await prisma.collection.upsert({
        where: { slug },
        update: { name: colName },
        create: { slug, name: colName, published: true },
      });
      collectionMap[colName] = dbCol.id;
    }

    // 3. Ensure Brands exist
    const brandMap: Record<string, string> = {};
    const brandsToEnsure = Array.from(new Set(catalogProducts.map((p) => p.brand)));
    for (const brandName of brandsToEnsure) {
      const slug = brandName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const dbBrand = await prisma.brand.upsert({
        where: { slug },
        update: { name: brandName },
        create: { slug, name: brandName, published: true },
      });
      brandMap[brandName] = dbBrand.id;
    }

    // 4. Upsert Products
    for (const item of catalogProducts) {
      try {
        const sku = item.sku || `SKU-${item.slug.toUpperCase()}`;
        const categoryId = categoryMap[item.category] || null;
        const brandId = brandMap[item.brand] || null;
        const collectionId = collectionMap[item.collection] || null;

        const imagesJson = JSON.stringify(item.gallery);
        const sizesJson = JSON.stringify(item.sizes);
        const applicationsJson = JSON.stringify(item.applications);

        const existingBySlug = existingDbProducts.find((p) => p.slug === item.slug);
        const existingBySku = existingDbProducts.find((p) => p.sku === sku);

        const match = existingBySlug || existingBySku;

        if (match) {
          report.matchedProductsCount++;
          await prisma.product.update({
            where: { id: match.id },
            data: {
              name: item.name,
              collection: item.collection,
              collectionId,
              brandId,
              categoryId,
              description: item.description,
              finish: item.finish,
              thickness: item.thickness,
              sizes: sizesJson,
              applications: applicationsJson,
              color: item.color,
              texture: item.texture,
              tag: item.tag || null,
              lifestyleImage: item.lifestyleImage,
              textureImage: item.textureImage,
              images: imagesJson,
              aspect: item.aspect,
              featured: item.featured || false,
              sku: sku,
              published: true,
              status: "ACTIVE",
            },
          });
          report.updatedProductsCount++;
          report.details.push(`UPDATED: ${item.name} (${item.slug})`);
        } else {
          await prisma.product.create({
            data: {
              slug: item.slug,
              name: item.name,
              collection: item.collection,
              collectionId,
              brandId,
              categoryId,
              description: item.description,
              finish: item.finish,
              thickness: item.thickness,
              sizes: sizesJson,
              applications: applicationsJson,
              color: item.color,
              texture: item.texture,
              tag: item.tag || null,
              lifestyleImage: item.lifestyleImage,
              textureImage: item.textureImage,
              images: imagesJson,
              aspect: item.aspect,
              featured: item.featured || false,
              sku: sku,
              published: true,
              status: "ACTIVE",
            },
          });
          report.newProductsCount++;
          report.details.push(`CREATED: ${item.name} (${item.slug})`);
        }
      } catch (err: any) {
        report.failedRecordsCount++;
        report.details.push(`FAILED (${item.slug}): ${err?.message || err}`);
      }
    }
  } catch (globalErr: any) {
    report.details.push(`GLOBAL SYNC ERROR: ${globalErr?.message || globalErr}`);
  }

  return report;
}
