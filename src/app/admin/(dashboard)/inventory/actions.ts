"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import type { ListParams, ListResult } from "@/hooks/useAdminList";
import type { Prisma } from "@prisma/client";

export type InventoryRow = Prisma.ProductGetPayload<{
  include: {
    category: { select: { name: true } };
    inventory: true;
  };
}>;

export async function listInventory(params: ListParams): Promise<ListResult<InventoryRow>> {
  await requirePermission("inventory", "view");

  const where: Prisma.ProductWhereInput = {
    deletedAt: null,
    ...(params.search
      ? {
          OR: [
            { name: { contains: params.search, mode: "insensitive" } },
            { sku: { contains: params.search, mode: "insensitive" } },
            { productCode: { contains: params.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: { select: { name: true } },
        inventory: true,
      },
      orderBy: params.sortBy === "sku" ? { sku: params.sortDir } : { name: "asc" },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
    }),
    prisma.product.count({ where }),
  ]);

  return { rows, total };
}

export interface InventoryUpdateInput {
  totalStock: number;
  availableStock: number;
  reservedStock: number;
  damagedStock: number;
  transitStock: number;
  minimumStock: number;
  maximumStock: number;
  stockStatus: string;
  notes?: string;
}

export async function updateInventory(productId: string, input: InventoryUpdateInput) {
  const session = await requirePermission("inventory", "edit");

  const before = await prisma.inventory.findUnique({ where: { productId } });

  const inventory = await prisma.inventory.upsert({
    where: { productId },
    create: {
      productId,
      totalStock: input.totalStock,
      availableStock: input.availableStock,
      reservedStock: input.reservedStock,
      damagedStock: input.damagedStock,
      transitStock: input.transitStock,
      minimumStock: input.minimumStock,
      maximumStock: input.maximumStock,
      stockStatus: input.stockStatus,
    },
    update: {
      totalStock: input.totalStock,
      availableStock: input.availableStock,
      reservedStock: input.reservedStock,
      damagedStock: input.damagedStock,
      transitStock: input.transitStock,
      minimumStock: input.minimumStock,
      maximumStock: input.maximumStock,
      stockStatus: input.stockStatus,
    },
  });

  // Calculate stock movement difference
  const oldAvailable = before?.availableStock ?? 0;
  const diff = input.availableStock - oldAvailable;

  await prisma.inventoryHistory.create({
    data: {
      productId,
      quantity: diff,
      type: "ADJUSTMENT",
      notes: input.notes || "Manual stock adjustment in Admin Panel",
      createdById: session.user.id,
    },
  });

  await logAudit({
    action: "inventory.update",
    entity: "Inventory",
    entityId: inventory.id,
    oldValue: before,
    newValue: inventory,
  });

  return inventory;
}

export async function getInventoryHistory(productId: string) {
  await requirePermission("inventory", "view");
  const history = await prisma.inventoryHistory.findMany({
    where: { productId },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  return history;
}
