import { z } from "zod";

export const googlePostSchema = z.object({
  type: z.enum(["UPDATE", "OFFER", "EVENT"]).default("UPDATE"),
  title: z.string().min(3).max(200),
  body: z.string().max(3000).optional().or(z.literal("")),
  image: z.string().max(600).optional().or(z.literal("")),
  ctaLabel: z.string().max(60).optional().or(z.literal("")),
  ctaUrl: z.string().max(600).optional().or(z.literal("")),
  startsAt: z.string().optional().or(z.literal("")),
  endsAt: z.string().optional().or(z.literal("")),
  sourceUrl: z.string().max(600).optional().or(z.literal("")),
  showroomId: z.string().optional().or(z.literal("")),
  published: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

export type GooglePostInput = z.infer<typeof googlePostSchema>;
