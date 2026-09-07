/**
 * Stock status vocabulary.
 *
 * These are the values `Inventory.stockStatus` is documented to hold in
 * schema.prisma — the depot app (prestige-inv) shares this database and owns
 * that column. The CMS was writing a different, invented set
 * ("IN_STOCK", "LIMITED_STOCK", "COMING_SOON") from the inventory form, the
 * block creator and the Excel importer, so stock the CMS marked available was
 * not recognised as available anywhere else.
 *
 * New writes use the canonical values below. Reads still have to cope with
 * rows already carrying the legacy words, so LEGACY_STOCK_STATUS_ALIASES maps
 * them on the way in — no production row is rewritten.
 */

export const STOCK_STATUSES = [
  "AVAILABLE",
  "LOW_STOCK",
  "OUT_OF_STOCK",
  "INCOMING",
  "BLOCKED",
  "PARTIALLY_AVAILABLE",
  "DAMAGED",
] as const;

export type StockStatus = (typeof STOCK_STATUSES)[number];

const LEGACY_STOCK_STATUS_ALIASES: Record<string, StockStatus> = {
  IN_STOCK: "AVAILABLE",
  LIMITED_STOCK: "LOW_STOCK",
  COMING_SOON: "INCOMING",
};

export function isStockStatus(value: string): value is StockStatus {
  return (STOCK_STATUSES as readonly string[]).includes(value);
}

/** Canonicalises a stored or submitted status; throws on anything unknown. */
export function normalizeStockStatus(value: string): StockStatus {
  const upper = value?.trim().toUpperCase() ?? "";
  if (isStockStatus(upper)) return upper;
  const alias = LEGACY_STOCK_STATUS_ALIASES[upper];
  if (alias) return alias;
  throw new Error(
    `Unknown stock status "${value}". Expected one of: ${STOCK_STATUSES.join(", ")}.`
  );
}

/** What the numbers say the status should be, used after a block changes them. */
export function deriveStockStatus(input: {
  availableStock: number;
  minimumStock: number;
  transitStock: number;
}): StockStatus {
  if (input.availableStock <= 0) {
    return input.transitStock > 0 ? "INCOMING" : "OUT_OF_STOCK";
  }
  if (input.minimumStock > 0 && input.availableStock <= input.minimumStock) return "LOW_STOCK";
  return "AVAILABLE";
}

export const STOCK_STATUS_LABELS: Record<StockStatus, string> = {
  AVAILABLE: "Available",
  LOW_STOCK: "Low stock",
  OUT_OF_STOCK: "Out of stock",
  INCOMING: "Incoming",
  BLOCKED: "Blocked",
  PARTIALLY_AVAILABLE: "Partially available",
  DAMAGED: "Damaged",
};
