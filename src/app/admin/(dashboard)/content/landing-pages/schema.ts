import { z } from "zod";

const block = z.object({
  heading: z.string().max(160).optional().or(z.literal("")),
  body: z.string().max(4000).optional().or(z.literal("")),
  image: z.string().max(600).optional().or(z.literal("")),
});

const faq = z.object({
  q: z.string().min(3).max(300),
  a: z.string().min(3).max(2000),
});

export const landingPageSchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(90)
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and hyphens only"),
  kind: z.enum(["local", "brand", "collection"]).default("local"),
  title: z.string().min(3).max(180),
  heading: z.string().min(3).max(200),
  subheading: z.string().max(300).optional().or(z.literal("")),
  intro: z.string().max(4000).optional().or(z.literal("")),
  blocks: z.array(block).default([]),
  city: z.string().max(80).optional().or(z.literal("")),
  locality: z.string().max(80).optional().or(z.literal("")),
  areaServed: z.array(z.string()).default([]),
  serviceType: z.string().max(120).optional().or(z.literal("")),
  heroImage: z.string().max(600).optional().or(z.literal("")),
  gallery: z.array(z.string()).default([]),
  faqs: z.array(faq).default([]),
  showroomIds: z.array(z.string()).default([]),
  featuredProductIds: z.array(z.string()).default([]),
  published: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

export type LandingPageInput = z.infer<typeof landingPageSchema>;
