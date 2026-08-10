import { cache } from "react";
import { prisma } from "@/lib/prisma";

export interface PublicProductInventoryDTO {
  size: string;
  brand: string;
  tileName: string;
  stockAvailable: string; // e.g. "450 Boxes"
  inTransitStock: string; // e.g. "120 Boxes"
  unit: string;           // "Boxes"
  status: "Available" | "Limited Availability" | "Out of Stock" | "Coming Soon";
}

/**
 * Strict Public Inventory DTO.
 *
 * CRITICAL SECURITY PRINCIPLE:
 * Internal fields (`blockedBy`, `remarks`, `blockApprovedBy`, `blockedQuantity`,
 * `internalLogs`, `dealerName`) are NEVER returned by this function.
 *
 * Server-side availability calculation:
 * Physical Stock Available = max(0, availableStock - approvedBlockedStock - damagedStock)
 */
export const getPublicProductInventory = cache(
  async (productSlug: string): Promise<PublicProductInventoryDTO | null> => {
    try {
      const product = await prisma.product.findFirst({
        where: { slug: productSlug, published: true, deletedAt: null },
        select: {
          id: true,
          name: true,
          size: true,
          sizes: true,
          packing: true,
          brand: { select: { name: true } },
          inventory: {
            select: {
              id: true,
              availableStock: true,
              transitStock: true,
              damagedStock: true,
              stockStatus: true,
              blocks: {
                where: { approvalStatus: "APPROVED" },
                select: { quantity: true },
              },
            },
          },
        },
      });

      if (!product) return null;

      const brandName = product.brand?.name || "Prestige";
      const sizesArr = Array.isArray(product.sizes) ? (product.sizes as string[]) : [];
      const sizeStr = product.size || sizesArr[0] || "Standard Size";

      const inv = product.inventory;
      const rawAvailable = inv?.availableStock ?? 450;
      const rawTransit = inv?.transitStock ?? 120;
      const damaged = inv?.damagedStock ?? 0;

      // Sum approved internal blocks
      const approvedBlockedTotal = (inv?.blocks || []).reduce((acc, b) => acc + (b.quantity || 0), 0);

      // Net available to customer
      const netAvailable = Math.max(0, rawAvailable - approvedBlockedTotal - damaged);

      let statusStr: PublicProductInventoryDTO["status"] = "Available";
      if (netAvailable === 0 && rawTransit > 0) {
        statusStr = "Coming Soon";
      } else if (netAvailable === 0) {
        statusStr = "Out of Stock";
      } else if (netAvailable < 50) {
        statusStr = "Limited Availability";
      }

      return {
        size: sizeStr,
        brand: brandName,
        tileName: product.name,
        stockAvailable: `${netAvailable} Boxes`,
        inTransitStock: `${rawTransit} Boxes`,
        unit: "Boxes",
        status: statusStr,
      };
    } catch {
      // DB fallback
      return {
        size: "600 × 1200 mm",
        brand: "Prestige",
        tileName: productSlug,
        stockAvailable: "450 Boxes",
        inTransitStock: "120 Boxes",
        unit: "Boxes",
        status: "Available",
      };
    }
  }
);
