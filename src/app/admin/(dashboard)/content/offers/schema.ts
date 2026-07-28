import { z } from "zod";

export const offerSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(2000).optional().or(z.literal("")),
  image: z.string().optional().or(z.literal("")),
  validFrom: z.string().optional().or(z.literal("")),
  validUntil: z.string().optional().or(z.literal("")),
  showCountdown: z.boolean().default(false),
  published: z.boolean().default(true),
});

export type OfferInput = z.infer<typeof offerSchema>;
