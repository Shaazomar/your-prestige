/**
 * Prestige Depot & Inventory Management Architecture Types (Phase 2 Ready)
 * Scalable definitions for regional warehouses, batch tracking, stock allocation, and dispatch manifests.
 */

export interface Depot {
  id: string;
  name: string;
  code: string;
  city: string;
  state: string;
  address: string;
  capacitySqFt: number;
  contactNumber: string;
  isActive: boolean;
}

export interface InventoryItem {
  id: string;
  depotId: string;
  productSlug: string;
  batchNumber: string;
  shadeCode: string;
  grade: "PREMIUM" | "STANDARD" | "COMMERCIAL";
  quantitySqFt: number;
  reservedSqFt: number;
  availableSqFt: number;
  rackLocation: string;
}

export interface DispatchManifest {
  id: string;
  manifestNumber: string;
  depotId: string;
  dealerId: string;
  vehicleNumber: string;
  driverPhone: string;
  items: {
    productSlug: string;
    batchNumber: string;
    quantityBoxes: number;
    quantitySqFt: number;
  }[];
  dispatchedAt: string;
  estimatedDelivery: string;
  status: "LOADING" | "IN_TRANSIT" | "DELIVERED";
}
