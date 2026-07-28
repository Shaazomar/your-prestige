import { z } from "zod";

export const albumSchema = z.object({
  title: z.string().min(2).max(150),
  slug: z.string().min(2).max(150).regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and hyphens only"),
  description: z.string().max(2000).optional().or(z.literal("")),
  coverImage: z.string().optional().or(z.literal("")),
  sortOrder: z.coerce.number().int().default(0),
  published: z.boolean().default(true),
});

export type AlbumInput = z.infer<typeof albumSchema>;
