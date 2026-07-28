import { z } from "zod";

export const bookingSchema = z.object({
  name: z.string().min(2).max(150),
  phone: z.string().min(7).max(20),
  email: z.string().email().optional().or(z.literal("")),
  requestedDate: z.string().min(1, "Pick a date"),
  status: z.enum(["PENDING", "CONFIRMED", "RESCHEDULED", "COMPLETED", "CANCELLED", "REJECTED", "NO_SHOW"]).default("PENDING"),
  notes: z.string().max(2000).optional().or(z.literal("")),
  assignedConsultantId: z.string().optional().nullable(),
});

export type BookingInput = z.infer<typeof bookingSchema>;
