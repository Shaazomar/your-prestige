"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, ArrowUpRight } from "lucide-react";
import { TextField, TextArea, SelectField } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

const formSchema = z.object({
  name: z.string().min(2, "Please enter your name"),
  phone: z
    .string()
    .min(10, "Enter a valid phone number")
    .regex(/^[+\d\s-]+$/, "Enter a valid phone number"),
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
  city: z.string().optional(),
  interest: z.string().optional(),
  budget: z.string().optional(),
  visitDate: z.string().optional(),
  preferredTime: z.string().optional(),
  showroomSlug: z.string().optional(),
  message: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export interface ShowroomOption {
  slug: string;
  name: string;
  locality: string | null;
  city: string;
}

interface LeadFormProps {
  type: "CONTACT" | "QUOTE" | "VISIT";
  submitLabel?: string;
  showVisitDate?: boolean;
  showBudget?: boolean;
  /** Showrooms to choose from — enables the branch + time picker */
  showrooms?: ShowroomOption[];
  /** Pre-selected showroom slug (from ?showroom=… on the booking page) */
  defaultShowroom?: string;
}

const TIME_SLOTS = [
  "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM",
  "3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM",
];

export function LeadForm({
  type,
  submitLabel = "Send Enquiry",
  showVisitDate = false,
  showBudget = false,
  showrooms,
  defaultShowroom,
}: LeadFormProps) {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { showroomSlug: defaultShowroom ?? "" },
  });

  async function onSubmit(values: FormValues) {
    setStatus("submitting");
    try {
      const params = new URLSearchParams(window.location.search);
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          ...values,
          visitDate: values.visitDate
            ? new Date(values.visitDate).toISOString()
            : undefined,
          utmSource: params.get("utm_source") ?? undefined,
          utmMedium: params.get("utm_medium") ?? undefined,
          utmCampaign: params.get("utm_campaign") ?? undefined,
        }),
      });
      if (!res.ok) throw new Error("Request failed");
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  return (
    <AnimatePresence mode="wait">
      {status === "success" ? (
        <motion.div
          key="success"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center rounded-3xl border hairline bg-white p-12 text-center shadow-soft"
        >
          <span className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gold/10">
            <CheckCircle2 className="h-8 w-8 text-gold" />
          </span>
          <h3 className="text-2xl font-semibold text-ink">Thank you.</h3>
          <p className="mt-3 max-w-sm text-slate-warm">
            Your request has been received. Our design team will reach out within a few
            working hours.
          </p>
        </motion.div>
      ) : (
        <motion.form
          key="form"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5"
          noValidate
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              label="Full Name *"
              placeholder="Your name"
              autoComplete="name"
              {...register("name")}
              error={errors.name?.message}
            />
            <TextField
              label="Phone *"
              placeholder="+91 …"
              type="tel"
              autoComplete="tel"
              {...register("phone")}
              error={errors.phone?.message}
            />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              label="Email"
              placeholder="you@example.com"
              type="email"
              autoComplete="email"
              {...register("email")}
              error={errors.email?.message}
            />
            <TextField
              label="City"
              placeholder="Mangaluru"
              {...register("city")}
              error={errors.city?.message}
            />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <SelectField label="I'm interested in" {...register("interest")}>
              <option value="">Select…</option>
              <option value="tiles">Premium Tiles</option>
              <option value="sanitary">Sanitaryware & Bathrooms</option>
              <option value="both">Tiles + Sanitary</option>
              <option value="project">Full Project / Trade</option>
            </SelectField>
            {showBudget && (
              <SelectField label="Approximate budget" {...register("budget")}>
                <option value="">Select…</option>
                <option value="under-2l">Under ₹2 Lakh</option>
                <option value="2l-5l">₹2 – 5 Lakh</option>
                <option value="5l-15l">₹5 – 15 Lakh</option>
                <option value="15l-plus">₹15 Lakh+</option>
              </SelectField>
            )}
            {showVisitDate && (
              <TextField
                label="Preferred visit date"
                type="date"
                min={new Date().toISOString().split("T")[0]}
                {...register("visitDate")}
              />
            )}
          </div>

          {showrooms && showrooms.length > 0 && (
            <div className="grid gap-5 sm:grid-cols-2">
              <SelectField label="Preferred showroom" {...register("showroomSlug")}>
                <option value="">Any showroom / not sure</option>
                {showrooms.map((s) => (
                  <option key={s.slug} value={s.slug}>
                    {s.locality ? `${s.locality}, ${s.city}` : s.city} — {s.name}
                  </option>
                ))}
              </SelectField>
              <SelectField label="Preferred time" {...register("preferredTime")}>
                <option value="">Any time</option>
                {TIME_SLOTS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </SelectField>
            </div>
          )}

          <TextArea
            label="Tell us about your project"
            placeholder="New villa, bathroom renovation, commercial space…"
            {...register("message")}
          />
          <Button
            type="submit"
            variant="gold"
            size="lg"
            className="w-full sm:w-auto"
            disabled={status === "submitting"}
          >
            {status === "submitting" ? "Sending…" : submitLabel}
            <ArrowUpRight className="h-5 w-5" />
          </Button>
          {status === "error" && (
            <p className="text-sm text-red-500">
              Something went wrong — please try again or call us directly.
            </p>
          )}
        </motion.form>
      )}
    </AnimatePresence>
  );
}
