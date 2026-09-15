"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import type { ListParams, ListResult } from "@/hooks/useAdminList";
import type { Prisma } from "@prisma/client";
import { deriveStockStatus, normalizeStockStatus } from "@/lib/inventory-status";
import { safePaging } from "@/lib/list-params";

/** Product columns the inventory table is allowed to sort on. */
const SORTABLE = new Set(["name", "sku", "productCode", "createdAt", "updatedAt"]);

/** Rejects NaN/Infinity/negative quantities before they reach the database. */
function quantity(value: number, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${field} must be a number.`);
  }
  if (value < 0) throw new Error(`${field} cannot be negative.`);
  return value;
}

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
    // Inventory is a separate operational concern from the website catalog —
    // a Product can exist purely as a catalog listing with no Inventory row
    // (e.g. a brand-site import). This page tracks stock, so it must only
    // ever list products that actually have an Inventory record, never the
    // full product table.
    inventory: { isNot: null },
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
      orderBy: SORTABLE.has(params.sortBy)
        ? { [params.sortBy]: params.sortDir }
        : { name: "asc" },
      ...safePaging(params.page, params.pageSize),
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

  const values = {
    totalStock: quantity(input.totalStock, "Total stock"),
    availableStock: quantity(input.availableStock, "Available stock"),
    reservedStock: quantity(input.reservedStock, "Reserved stock"),
    damagedStock: quantity(input.damagedStock, "Damaged stock"),
    transitStock: quantity(input.transitStock, "Transit stock"),
    minimumStock: quantity(input.minimumStock, "Minimum stock"),
    maximumStock: quantity(input.maximumStock, "Maximum stock"),
    stockStatus: normalizeStockStatus(input.stockStatus),
  };

  if (values.availableStock + values.reservedStock + values.damagedStock > values.totalStock) {
    throw new Error(
      "Available + reserved + damaged stock cannot exceed the total physical stock."
    );
  }

  const product = await prisma.product.findFirst({
    where: { id: productId, deletedAt: null },
    select: { id: true },
  });
  if (!product) throw new Error("Product not found.");

  const before = await prisma.inventory.findUnique({ where: { productId } });

  const inventory = await prisma.inventory.upsert({
    where: { productId },
    create: { productId, ...values },
    update: values,
  });

  const oldAvailable = before?.availableStock ?? 0;
  const diff = values.availableStock - oldAvailable;

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

  const blockedBy = input.blockedBy?.trim();
  if (!blockedBy) throw new Error("Blocked by is required.");

  const qty = quantity(input.quantity, "Quantity");
  if (qty <= 0) throw new Error("Quantity must be greater than zero.");

  const expiresDays = input.expiresDays ?? 7;
  if (!Number.isFinite(expiresDays) || expiresDays <= 0) {
    throw new Error("Block duration must be a positive number of days.");
  }

  const product = await prisma.product.findFirst({
    where: { id: input.productId, deletedAt: null },
    select: { id: true },
  });
  if (!product) throw new Error("Product not found.");

  // A product with no inventory row has no stock — it is not 450 boxes with
  // 120 in transit, which is what this used to invent. Start it at zero and
  // let a real stock adjustment set the numbers.
  let inv = await prisma.inventory.findUnique({ where: { productId: input.productId } });
  if (!inv) {
    inv = await prisma.inventory.create({
      data: { productId: input.productId, stockStatus: "OUT_OF_STOCK" },
    });
  }

  // Pending blocks are commitments against the same available pool, so they
  // count towards the ceiling even before anyone approves them.
  const pending = await prisma.inventoryBlock.aggregate({
    where: { inventoryId: inv.id, approvalStatus: "PENDING" },
    _sum: { quantity: true },
  });
  const alreadyPending = pending._sum.quantity ?? 0;
  if (qty + alreadyPending > inv.availableStock) {
    throw new Error(
      `Only ${inv.availableStock - alreadyPending} of ${inv.availableStock} available can still be blocked` +
        (alreadyPending > 0 ? ` (${alreadyPending} already awaiting approval).` : ".")
    );
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresDays);

  const block = await prisma.inventoryBlock.create({
    data: {
      inventoryId: inv.id,
      blockedBy,
      quantity: qty,
      remarks: input.remarks?.trim() || null,
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
  if (!block.inventory) throw new Error("This block has no inventory record to draw from.");

  // Approving twice used to deduct the quantity twice — the update carried no
  // status precondition, so a double click or a second approver silently
  // corrupted the stock figures.
  if (block.approvalStatus !== "PENDING") {
    throw new Error(`This block is already ${block.approvalStatus.toLowerCase()}.`);
  }
  if (block.quantity > block.inventory.availableStock) {
    throw new Error(
      `Cannot approve ${block.quantity} — only ${block.inventory.availableStock} available.`
    );
  }

  const newAvailable = block.inventory.availableStock - block.quantity;
  const newReserved = block.inventory.reservedStock + block.quantity;

  // One transaction: the block flips to APPROVED and the stock moves, or
  // neither happens. The status precondition inside the updateMany is what
  // makes two concurrent approvals safe — the loser matches zero rows.
  const [approved] = await prisma.$transaction(async (tx) => {
    const claimed = await tx.inventoryBlock.updateMany({
      where: { id: blockId, approvalStatus: "PENDING" },
      data: {
        approvalStatus: "APPROVED",
        blockApprovedBy: session.user.name || "Store Manager",
      },
    });
    if (claimed.count === 0) {
      throw new Error("This block was already actioned by someone else.");
    }

    await tx.inventory.update({
      where: { id: block.inventory!.id },
      data: {
        availableStock: newAvailable,
        reservedStock: newReserved,
        stockStatus: deriveStockStatus({
          availableStock: newAvailable,
          minimumStock: block.inventory!.minimumStock,
          transitStock: block.inventory!.transitStock,
        }),
      },
    });

    await tx.inventoryHistory.create({
      data: {
        productId: block.inventory!.productId,
        quantity: -block.quantity,
        type: "BLOCK_APPROVED",
        notes: `Block approved for ${block.blockedBy} (${block.quantity} Boxes). Remarks: ${block.remarks || "—"}`,
        createdById: session.user.id,
      },
    });

    return [await tx.inventoryBlock.findUniqueOrThrow({ where: { id: blockId } })];
  });

  await logAudit({
    action: "inventory.block.approve",
    entity: "InventoryBlock",
    entityId: blockId,
    newValue: approved,
  });

  return approved;
}

export async function rejectInventoryBlock(blockId: string) {
  const session = await requirePermission("inventory", "edit");

  const existing = await prisma.inventoryBlock.findUnique({ where: { id: blockId } });
  if (!existing) throw new Error("Block record not found");
  if (existing.approvalStatus !== "PENDING") {
    throw new Error(`This block is already ${existing.approvalStatus.toLowerCase()}.`);
  }

  const rejected = await prisma.inventoryBlock.updateMany({
    where: { id: blockId, approvalStatus: "PENDING" },
    data: {
      approvalStatus: "REJECTED",
      blockApprovedBy: session.user.name || "Store Manager",
    },
  });
  if (rejected.count === 0) throw new Error("This block was already actioned by someone else.");
  const block = await prisma.inventoryBlock.findUniqueOrThrow({ where: { id: blockId } });

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
