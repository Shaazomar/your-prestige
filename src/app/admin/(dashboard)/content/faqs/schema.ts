import { z } from "zod";

export const faqSchema = z.object({
  question: z.string().min(5).max(300),
  answer: z.string().min(5).max(3000),
  category: z.string().max(100).optional().or(z.literal("")),
  sortOrder: z.coerce.number().int().default(0),
  published: z.boolean().default(true),
});

export type FaqInput = z.infer<typeof faqSchema>;
