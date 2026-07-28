import { z } from "zod";

export const postSchema = z.object({
  title: z.string().min(2).max(200),
  slug: z.string().min(2).max(200).regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and hyphens only"),
  excerpt: z.string().max(500).optional().or(z.literal("")),
  content: z.string().min(10, "Write at least a few sentences"),
  coverImage: z.string().optional().or(z.literal("")),
  category: z.string().max(100).optional().or(z.literal("")),
  tags: z.array(z.string()).default([]),
  status: z.enum(["draft", "scheduled", "published"]).default("draft"),
  scheduledAt: z.string().optional().or(z.literal("")),
});

export type PostInput = z.infer<typeof postSchema>;
