import { z } from "zod";

export const showroomSchema = z.object({
  name: z.string().min(2, "Name is required").max(150),
  slug: z
    .string()
    .min(2)
    .max(150)
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and hyphens only"),
  subtitle: z.string().max(150).optional().or(z.literal("")),

  addressLine: z.string().min(3, "Address is required").max(300),
  locality: z.string().max(120).optional().or(z.literal("")),
  city: z.string().min(2, "City is required").max(120),
  state: z.string().max(120).default("Karnataka"),
  postalCode: z.string().max(12).optional().or(z.literal("")),
  latitude: z.coerce.number().min(-90).max(90).optional().nullable(),
  longitude: z.coerce.number().min(-180).max(180).optional().nullable(),
  mapUrl: z.string().max(600).optional().or(z.literal("")),
  mapEmbedUrl: z.string().max(600).optional().or(z.literal("")),
  directions: z.string().max(1000).optional().or(z.literal("")),

  phone: z.string().min(7, "Phone is required").max(24),
  whatsapp: z.string().max(24).optional().or(z.literal("")),
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
  managerName: z.string().max(120).optional().or(z.literal("")),
  managerPhone: z.string().max(24).optional().or(z.literal("")),

  hoursWeekdays: z.string().max(200).default("Monday–Saturday: 9:00 AM – 7:00 PM"),
  hoursSunday: z.string().max(200).default("Sunday: Closed"),

  heroImage: z.string().optional().or(z.literal("")),
  gallery: z.array(z.string()).default([]),
  video: z.string().max(600).optional().or(z.literal("")),

  description: z.string().max(4000).optional().or(z.literal("")),
  brands: z.array(z.string()).default([]),
  amenities: z.array(z.string()).default([]),
  featuredProductIds: z.array(z.string()).default([]),

  isFlagship: z.boolean().default(false),
  published: z.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),

  // — Google Business Profile —
  // Maintained by hand: the Business Profile API needs per-user OAuth,
  // verified location ownership and an approved quota project, none of which
  // this deployment has. These fields are the seam if that changes.
  googlePlaceId: z.string().max(120).optional().or(z.literal("")),
  googleReviewUrl: z.string().max(600).optional().or(z.literal("")),
  googleWriteReviewUrl: z.string().max(600).optional().or(z.literal("")),
  googleRating: z.coerce.number().min(0).max(5).optional(),
  googleReviewCount: z.coerce.number().int().min(0).default(0),
  googlePhotos: z.array(z.string()).default([]),
});

export type ShowroomInput = z.infer<typeof showroomSchema>;
