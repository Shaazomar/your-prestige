import { z } from "zod";

export const testimonialSchema = z.object({
  name: z.string().min(2).max(150),
  role: z.string().max(150).optional().or(z.literal("")),
  quote: z.string().min(5, "Quote must be at least 5 characters").max(2000),
  image: z.string().optional().or(z.literal("")),
  rating: z.coerce.number().int().min(1).max(5).default(5),
  videoUrl: z.string().optional().or(z.literal("")),
  googleReviewUrl: z.string().optional().or(z.literal("")),
  source: z.enum(["google", "video", "manual"]).default("manual"),
  featured: z.boolean().default(false),
  published: z.boolean().default(true),
});

export type TestimonialInput = z.infer<typeof testimonialSchema>;
