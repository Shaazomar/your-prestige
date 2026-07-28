import { z } from "zod";

export const projectSchema = z.object({
  title: z.string().min(2).max(150),
  slug: z.string().min(2).max(150).regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and hyphens only"),
  type: z.enum(["Villa", "Apartment", "Hotel", "Commercial", "Residential"]),
  client: z.string().max(150).optional().or(z.literal("")),
  builder: z.string().max(150).optional().or(z.literal("")),
  architect: z.string().max(150).optional().or(z.literal("")),
  location: z.string().max(150).optional().or(z.literal("")),
  year: z.string().max(10).optional().or(z.literal("")),
  completionDate: z.string().optional().or(z.literal("")),
  description: z.string().max(4000).optional().or(z.literal("")),
  images: z.array(z.string()).default([]),
  video: z.string().optional().or(z.literal("")),
  featured: z.boolean().default(false),
  published: z.boolean().default(true),
});

export type ProjectInput = z.infer<typeof projectSchema>;
