import { z } from "zod";

export const brandSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  slug: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and hyphens only"),
  logo: z.string().optional().or(z.literal("")),
  banner: z.string().optional().or(z.literal("")),
  description: z.string().max(2000).optional().or(z.literal("")),
  website: z.string().optional().or(z.literal("")),
  catalogPdf: z.string().optional().or(z.literal("")),
  featured: z.boolean().default(false),
  sortOrder: z.coerce.number().int().default(0),
  published: z.boolean().default(true),
});

export type BrandInput = z.infer<typeof brandSchema>;
