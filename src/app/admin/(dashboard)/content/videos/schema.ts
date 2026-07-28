import { z } from "zod";

export const videoSchema = z.object({
  title: z.string().min(2).max(150),
  slug: z.string().min(2).max(150).regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and hyphens only"),
  description: z.string().max(2000).optional().or(z.literal("")),
  provider: z.enum(["YOUTUBE", "VIMEO", "UPLOAD"]).default("YOUTUBE"),
  url: z.string().min(3, "A video URL is required"),
  thumbnail: z.string().optional().or(z.literal("")),
  category: z.string().max(100).optional().or(z.literal("")),
  featured: z.boolean().default(false),
  published: z.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
});

export type VideoInput = z.infer<typeof videoSchema>;
