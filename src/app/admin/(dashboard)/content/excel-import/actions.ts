"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";

export interface ImportRowData {
  sku: string;
  name: string;
  price?: number | null;
  mrp?: number | null;
  categoryName?: string | null;
  collectionName?: string | null;
  brandName?: string | null;
  stock?: number | null;
}

export async function importProductRow(data: ImportRowData) {
  const session = await requirePermission("catalogImports", "create");

  if (!data.sku || !data.name) {
    throw new Error("SKU and Product Name are required fields.");
  }

  // 1. Resolve Category by name (create if not exists)
  let categoryId: string | null = null;
  if (data.categoryName) {
    const slug = slugify(data.categoryName);
    let cat = await prisma.category.findUnique({ where: { slug } });
    if (!cat) {
      cat = await prisma.category.create({
        data: { name: data.categoryName, slug, createdById: session.user.id },
      });
    }
    categoryId = cat.id;
  }

  // 2. Resolve Collection by name (create if not exists)
  let collectionId: string | null = null;
  if (data.collectionName) {
    const slug = slugify(data.collectionName);
    let col = await prisma.collection.findUnique({ where: { slug } });
    if (!col) {
      col = await prisma.collection.create({
        data: { name: data.collectionName, slug, createdById: session.user.id },
      });
    }
    collectionId = col.id;
  }

  // 3. Resolve Brand by name (create if not exists)
  let brandId: string | null = null;
  if (data.brandName) {
    const slug = slugify(data.brandName);
    let brand = await prisma.brand.findUnique({ where: { slug } });
    if (!brand) {
      brand = await prisma.brand.create({
        data: { name: data.brandName, slug, createdById: session.user.id },
      });
    }
    brandId = brand.id;
  }

  // 4. Create or Update Product
  const existing = await prisma.product.findUnique({ where: { sku: data.sku } });
  let product;
  let actionType: "created" | "updated";

  const productData = {
    name: data.name,
    sku: data.sku,
    productCode: data.sku, // keep legacy field in sync
    slug: slugify(data.name) + "-" + data.sku.toLowerCase(),
    price: data.price !== undefined ? data.price : null,
    mrp: data.mrp !== undefined ? data.mrp : null,
    categoryId,
    collectionId,
    brandId,
    collection: data.collectionName || null, // legacy text field
  };

  if (existing) {
    product = await prisma.product.update({
      where: { id: existing.id },
      data: {
        ...productData,
        updatedById: session.user.id,
      },
    });
    actionType = "updated";
  } else {
    product = await prisma.product.create({
      data: {
        ...productData,
        createdById: session.user.id,
        updatedById: session.user.id,
      },
    });
    actionType = "created";
  }

  // 5. Update Inventory stock if provided
  if (data.stock !== undefined && data.stock !== null) {
    const invBefore = await prisma.inventory.findUnique({ where: { productId: product.id } });
    
    await prisma.inventory.upsert({
      where: { productId: product.id },
      create: {
        productId: product.id,
        totalStock: data.stock,
        availableStock: data.stock,
        stockStatus: data.stock > 0 ? "IN_STOCK" : "OUT_OF_STOCK",
      },
      update: {
        totalStock: data.stock,
        availableStock: data.stock,
        stockStatus: data.stock > 0 ? "IN_STOCK" : "OUT_OF_STOCK",
      },
    });

    const diff = data.stock - (invBefore?.availableStock ?? 0);
    if (diff !== 0) {
      await prisma.inventoryHistory.create({
        data: {
          productId: product.id,
          quantity: diff,
          type: "RESTOCK",
          notes: "Stock updated via bulk Excel/CSV import",
          createdById: session.user.id,
        },
      });
    }
  }

  await logAudit({
    action: `product.import_${actionType}`,
    entity: "Product",
    entityId: product.id,
    newValue: product,
  });

  return { actionType, product };
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}
