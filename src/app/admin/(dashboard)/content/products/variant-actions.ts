"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { Prisma } from "@prisma/client";

/**
 * Product variants — the concrete size/finish/colour versions of one product.
 *
 * These never create inventory. Stock stays keyed to Product, so adding or
 * removing a variant cannot touch a stock row, and a catalogue-only product
 * keeps no inventory record at all.
 */

export interface VariantInput {
  sku?: string | null;
  name?: string | null;
  size?: string | null;
  finish?: string | null;
  color?: string | null;
  surface?: string | null;
  thickness?: string | null;
  unit?: string | null;
  sortOrder?: number;
  active?: boolean;
}

export interface VariantRow {
  id: string;
  sku: string | null;
  name: string | null;
  size: string | null;
  finish: string | null;
  color: string | null;
  unit: string | null;
  sortOrder: number;
  active: boolean;
}

export async function listVariants(productId: string): Promise<VariantRow[]> {
  await requirePermission("products", "view");
  return prisma.productVariant.findMany({
    where: { productId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: {
      id: true, sku: true, name: true, size: true, finish: true,
      color: true, unit: true, sortOrder: true, active: true,
    },
  });
}

function clean(input: VariantInput) {
  const trim = (v: string | null | undefined) => v?.trim() || null;
  return {
    sku: trim(input.sku),
    name: trim(input.name),
    size: trim(input.size),
    finish: trim(input.finish),
    color: trim(input.color),
    surface: trim(input.surface),
    thickness: trim(input.thickness),
    unit: trim(input.unit),
    sortOrder: Number.isFinite(input.sortOrder) ? Number(input.sortOrder) : 0,
    active: input.active ?? true,
  };
}

export async function createVariant(productId: string, input: VariantInput) {
  const session = await requirePermission("products", "edit");

  const product = await prisma.product.findFirst({
    where: { id: productId, deletedAt: null },
    select: { id: true },
  });
  if (!product) throw new Error("Product not found.");

  const data = clean(input);
  if (!data.sku && !data.name && !data.size) {
    throw new Error("A variant needs at least a SKU, a name or a size.");
  }

  try {
    const variant = await prisma.productVariant.create({ data: { productId, ...data } });
    await logAudit({
      action: "product.variant.create",
      entity: "ProductVariant",
      entityId: variant.id,
      newValue: variant,
      meta: { productId, by: session.user.id },
    });
    return variant.id;
  } catch (err) {
    // The unique index is (productId, sku) — a duplicate article code on the
    // same product is a data-entry slip, so say so rather than surfacing P2002.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new Error(`This product already has a variant with SKU "${data.sku}".`);
    }
    throw err;
  }
}

export async function updateVariant(id: string, input: VariantInput) {
  const session = await requirePermission("products", "edit");
  const before = await prisma.productVariant.findUniqueOrThrow({ where: { id } });

  try {
    const variant = await prisma.productVariant.update({ where: { id }, data: clean(input) });
    await logAudit({
      action: "product.variant.update",
      entity: "ProductVariant",
      entityId: id,
      oldValue: before,
      newValue: variant,
      meta: { by: session.user.id },
    });
    return { ok: true };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new Error("Another variant of this product already uses that SKU.");
    }
    throw err;
  }
}

/**
 * Hard delete — a variant carries no stock and nothing references it, so there
 * is no soft-delete state to preserve. The audit row keeps the record.
 */
export async function deleteVariant(id: string) {
  const session = await requirePermission("products", "delete");
  const before = await prisma.productVariant.findUniqueOrThrow({ where: { id } });
  await prisma.productVariant.delete({ where: { id } });
  await logAudit({
    action: "product.variant.delete",
    entity: "ProductVariant",
    entityId: id,
    oldValue: before,
    meta: { by: session.user.id },
  });
  return { ok: true };
}
