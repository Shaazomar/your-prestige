import { z } from "zod";

export const collectionSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and hyphens only"),
  description: z.string().max(2000).optional().or(z.literal("")),
  image: z.string().optional().or(z.literal("")),
  sortOrder: z.coerce.number().int().default(0),
  published: z.boolean().default(true),
});

export type CollectionInput = z.infer<typeof collectionSchema>;
