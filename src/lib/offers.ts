import { cache } from "react";
import { prisma } from "@/lib/prisma";

export interface OfferItem {
  id?: string;
  title: string;
  body: string;
  tag: string;
  banner?: string | null;
}

const fallbackOffers: OfferItem[] = [
  {
    title: "The New Home Privilege",
    body: "Complimentary design consultation + site measurement for full-home projects, with staged delivery planning included.",
    tag: "For Homeowners",
  },
  {
    title: "Trade Partner Advantage",
    body: "Registered architects and builders unlock priority sampling, dedicated account management and project-scale pricing.",
    tag: "For Professionals",
  },
  {
    title: "Bathroom Sanctuary Package",
    body: "Curated bathroom suites — tiles, sanitary and fittings composed together — with preferential package pricing.",
    tag: "Limited Season",
  },
];

export const getActiveOffers = cache(async (): Promise<OfferItem[]> => {
  try {
    const rows = await prisma.offer.findMany({
      where: { status: "ACTIVE", deletedAt: null },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    });
    if (rows.length > 0) {
      return rows.map((r) => ({
        id: r.id,
        title: r.name,
        body: r.description || "Special seasonal privilege across Prestige Collections.",
        tag: r.type.replace(/_/g, " "),
        banner: r.banner,
      }));
    }
  } catch {
    // DB fallback
  }

  return fallbackOffers;
});
