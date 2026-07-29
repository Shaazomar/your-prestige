import { z } from "zod";

/** Edits an admin can make to a staged product before it's published. */
export const extractedProductSchema = z.object({
  name: z.string().min(2, "Name is required").max(160),
  brandName: z.string().max(120).optional().or(z.literal("")),
  collectionName: z.string().max(160).optional().or(z.literal("")),
  productCode: z.string().max(60).optional().or(z.literal("")),
  sizes: z.array(z.string()).default([]),
  finish: z.string().max(80).optional().or(z.literal("")),
  thickness: z.string().max(40).optional().or(z.literal("")),
  material: z.string().max(80).optional().or(z.literal("")),
  color: z.string().max(60).optional().or(z.literal("")),
  surface: z.string().max(80).optional().or(z.literal("")),
  applications: z.array(z.string()).default([]),
  applicationTags: z.array(z.string()).default([]),
  premiumDescription: z.string().max(4000).optional().or(z.literal("")),
  seoTitle: z.string().max(120).optional().or(z.literal("")),
  seoDescription: z.string().max(320).optional().or(z.literal("")),
  slug: z
    .string()
    .regex(/^[a-z0-9-]*$/, "Lowercase letters, numbers and hyphens only")
    .max(90)
    .optional()
    .or(z.literal("")),
  featured: z.boolean().default(false),
  hidden: z.boolean().default(false),
  publishAsDraft: z.boolean().default(true),
  reviewNote: z.string().max(1000).optional().or(z.literal("")),
});

export type ExtractedProductInput = z.infer<typeof extractedProductSchema>;

/** Creating an import: the file is handled separately as multipart. */
export const createImportSchema = z.object({
  filename: z.string().min(1),
  fileUrl: z.string().min(1),
  filePublicId: z.string().optional().or(z.literal("")),
  fileSize: z.coerce.number().int().nonnegative(),
  brandId: z.string().optional().or(z.literal("")),
  brandNameGuess: z.string().max(120).optional().or(z.literal("")),
});

export type CreateImportInput = z.infer<typeof createImportSchema>;

/** Which category published products land in — the public routes only serve three. */
export const PUBLISH_CATEGORIES = ["tiles", "sanitary", "designer-picks"] as const;

export const publishSchema = z.object({
  importId: z.string().min(1),
  category: z.enum(PUBLISH_CATEGORIES).default("tiles"),
  /** Publish live immediately, or create unpublished Product drafts. */
  publishLive: z.boolean().default(false),
});

export type PublishInput = z.infer<typeof publishSchema>;
