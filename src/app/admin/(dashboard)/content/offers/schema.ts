import { z } from "zod";

export const offerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(200),
  type: z.enum(["PRODUCT", "COLLECTION", "CATEGORY", "SEASONAL", "FESTIVAL", "LIMITED_TIME", "FEATURED"]),
  productId: z.string().optional().nullable(),
  collectionId: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  originalPrice: z.coerce.number().optional().nullable(),
  offerPrice: z.coerce.number().optional().nullable(),
  discountPercentage: z.coerce.number().optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  banner: z.string().optional().or(z.literal("")),
  description: z.string().max(2000).optional().or(z.literal("")),
  status: z.enum(["ACTIVE", "INACTIVE", "SCHEDULED"]).default("ACTIVE"),
  priority: z.coerce.number().int().default(0),
  featured: z.boolean().default(false),
});

export type OfferInput = z.infer<typeof offerSchema>;
