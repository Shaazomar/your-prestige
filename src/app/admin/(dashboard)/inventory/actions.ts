"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import type { ListParams, ListResult } from "@/hooks/useAdminList";
import type { Prisma } from "@prisma/client";

export type InventoryRow = Prisma.ProductGetPayload<{
  include: {
    category: { select: { name: true } };
    brand: { select: { name: true } };
    inventory: {
      include: {
        blocks: {
          orderBy: { createdAt: "desc" };
        };
      };
    };
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
            { collection: { contains: params.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: { select: { name: true } },
        brand: { select: { name: true } },
        inventory: {
          include: {
            blocks: {
              orderBy: { createdAt: "desc" },
            },
          },
        },
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

export interface CreateBlockInput {
  productId: string;
  blockedBy: string;
  quantity: number;
  remarks?: string;
  expiresDays?: number;
}

export async function createInventoryBlock(input: CreateBlockInput) {
  const session = await requirePermission("inventory", "edit");

  // Ensure inventory record exists
  let inv = await prisma.inventory.findUnique({ where: { productId: input.productId } });
  if (!inv) {
    inv = await prisma.inventory.create({
      data: {
        productId: input.productId,
        totalStock: 500,
        availableStock: 450,
        transitStock: 120,
        stockStatus: "IN_STOCK",
      },
    });
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (input.expiresDays || 7));

  const block = await prisma.inventoryBlock.create({
    data: {
      inventoryId: inv.id,
      blockedBy: input.blockedBy,
      quantity: input.quantity,
      remarks: input.remarks || null,
      approvalStatus: "PENDING",
      expiresAt,
    },
  });

  await logAudit({
    action: "inventory.block.create",
    entity: "InventoryBlock",
    entityId: block.id,
    newValue: block,
    meta: { by: session.user.id },
  });

  return block;
}

export async function approveInventoryBlock(blockId: string) {
  const session = await requirePermission("inventory", "edit");

  const block = await prisma.inventoryBlock.findUnique({
    where: { id: blockId },
    include: { inventory: true },
  });
  if (!block) throw new Error("Block record not found");

  const updatedBlock = await prisma.inventoryBlock.update({
    where: { id: blockId },
    data: {
      approvalStatus: "APPROVED",
      blockApprovedBy: session.user.name || "Store Manager",
    },
  });

  // Deduct available stock and add to reserved
  if (block.inventory) {
    const newAvailable = Math.max(0, block.inventory.availableStock - block.quantity);
    const newReserved = block.inventory.reservedStock + block.quantity;
    await prisma.inventory.update({
      where: { id: block.inventory.id },
      data: {
        availableStock: newAvailable,
        reservedStock: newReserved,
      },
    });

    await prisma.inventoryHistory.create({
      data: {
        productId: block.inventory.productId,
        quantity: -block.quantity,
        type: "BLOCK_APPROVED",
        notes: `Block approved for ${block.blockedBy} (${block.quantity} Boxes). Remarks: ${block.remarks || "—"}`,
        createdById: session.user.id,
      },
    });
  }

  await logAudit({
    action: "inventory.block.approve",
    entity: "InventoryBlock",
    entityId: blockId,
    newValue: updatedBlock,
  });

  return updatedBlock;
}

export async function rejectInventoryBlock(blockId: string) {
  const session = await requirePermission("inventory", "edit");

  const block = await prisma.inventoryBlock.update({
    where: { id: blockId },
    data: {
      approvalStatus: "REJECTED",
      blockApprovedBy: session.user.name || "Store Manager",
    },
  });

  await logAudit({
    action: "inventory.block.reject",
    entity: "InventoryBlock",
    entityId: blockId,
    newValue: block,
  });

  return block;
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
