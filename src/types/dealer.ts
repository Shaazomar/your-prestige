/**
 * Prestige Dealer & B2B Portal Architecture Types (Phase 2 Ready)
 * Scalable definitions for dealer onboarding, credit limits, pricing tiers, stock blocking, and order management.
 */

export type DealerTier = "SILVER" | "GOLD" | "PLATINUM" | "DIAMOND" | "ENTERPRISE";

export type OrderStatus =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "PROCESSING"
  | "DISPATCHED"
  | "DELIVERED"
  | "CANCELLED";

export interface DealerProfile {
  id: string;
  businessName: string;
  gstin: string;
  tier: DealerTier;
  creditLimit: number;
  availableCredit: number;
  assignedDepotId: string;
  contactPerson: {
    name: string;
    email: string;
    phone: string;
  };
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
  approvedAt: string;
}

export interface B2BQuoteRequest {
  id: string;
  dealerId?: string;
  contactName: string;
  companyName: string;
  email: string;
  phone: string;
  city: string;
  projectType: "RESIDENTIAL" | "COMMERCIAL" | "HOSPITALITY" | "INFRASTRUCTURE";
  items: {
    productSlug: string;
    quantitySqFt: number;
    notes?: string;
  }[];
  status: "NEW" | "REVIEWING" | "QUOTED" | "CONVERTED" | "REJECTED";
  createdAt: string;
}

export interface StockReservation {
  id: string;
  dealerId: string;
  productSlug: string;
  quantitySqFt: number;
  depotId: string;
  expiresAt: string;
  status: "ACTIVE" | "EXPIRED" | "CONVERTED_TO_ORDER" | "RELEASED";
}
