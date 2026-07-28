import { z } from "zod";

export const seoSchema = z.object({
  path: z.string().min(1, "Path is required").regex(/^\//, "Path must start with /"),
  title: z.string().max(200).optional().or(z.literal("")),
  description: z.string().max(500).optional().or(z.literal("")),
  keywords: z.string().max(500).optional().or(z.literal("")),
  canonical: z.string().optional().or(z.literal("")),
  ogImage: z.string().optional().or(z.literal("")),
  jsonLd: z.string().max(5000).optional().or(z.literal("")),
  noIndex: z.boolean().default(false),
});

export type SeoInput = z.infer<typeof seoSchema>;

export const redirectSchema = z.object({
  fromPath: z.string().min(1).regex(/^\//, "Must start with /"),
  toPath: z.string().min(1),
  statusCode: z.coerce.number().int().refine((n) => [301, 302, 307, 308].includes(n), "Must be 301, 302, 307 or 308"),
  active: z.boolean().default(true),
});

export type RedirectInput = z.infer<typeof redirectSchema>;
