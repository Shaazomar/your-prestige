import { z } from "zod";

export const inviteUserSchema = z.object({
  name: z.string().min(2).max(150),
  email: z.string().email(),
  role: z.enum(["SUPER_ADMIN", "OWNER", "MARKETING", "CONTENT", "SEO", "SUPPORT", "VIEWER"]),
});

export type InviteUserInput = z.infer<typeof inviteUserSchema>;

export const editUserSchema = z.object({
  name: z.string().min(2).max(150),
  role: z.enum(["SUPER_ADMIN", "OWNER", "MARKETING", "CONTENT", "SEO", "SUPPORT", "VIEWER"]),
});

export type EditUserInput = z.infer<typeof editUserSchema>;
