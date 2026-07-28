"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AField, ATextArea, ASelect, AToggle } from "@/components/admin/FormField";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { testimonialSchema, type TestimonialInput } from "./schema";
import { createTestimonial, updateTestimonial } from "./actions";
import type { Testimonial } from "@prisma/client";

const empty: TestimonialInput = { name: "", role: "", quote: "", image: "", rating: 5, videoUrl: "", googleReviewUrl: "", source: "manual", featured: false, published: true };

export function TestimonialForm({ testimonial, onSuccess }: { testimonial: Testimonial | null; onSuccess: () => void }) {
  const [values, setValues] = useState<TestimonialInput>(
    testimonial
      ? { name: testimonial.name, role: testimonial.role ?? "", quote: testimonial.quote, image: testimonial.image ?? "", rating: testimonial.rating, videoUrl: testimonial.videoUrl ?? "", googleReviewUrl: testimonial.googleReviewUrl ?? "", source: (testimonial.source as TestimonialInput["source"]) ?? "manual", featured: testimonial.featured, published: testimonial.published }
      : empty
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = testimonialSchema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) fieldErrors[issue.path[0] as string] = issue.message;
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      if (testimonial) {
        await updateTestimonial(testimonial.id, parsed.data);
        toast.success("Testimonial updated");
      } else {
        await createTestimonial(parsed.data);
        toast.success("Testimonial created");
      }
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <AField label="Name" required value={values.name} onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))} error={errors.name} />
        <AField label="Role / Location" value={values.role} onChange={(e) => setValues((v) => ({ ...v, role: e.target.value }))} placeholder="Villa Owner, Bejai" />
      </div>
      <ATextArea label="Quote" required value={values.quote} onChange={(e) => setValues((v) => ({ ...v, quote: e.target.value }))} error={errors.quote} />
      <ImageUploadField label="Photo" value={values.image || null} onChange={(url) => setValues((v) => ({ ...v, image: url ?? "" }))} aspect="aspect-square" />
      <div className="grid grid-cols-2 gap-4">
        <ASelect label="Rating" value={values.rating} onChange={(e) => setValues((v) => ({ ...v, rating: Number(e.target.value) }))}>
          {[5, 4, 3, 2, 1].map((r) => <option key={r} value={r}>{r} Star{r > 1 ? "s" : ""}</option>)}
        </ASelect>
        <ASelect label="Source" value={values.source} onChange={(e) => setValues((v) => ({ ...v, source: e.target.value as TestimonialInput["source"] }))}>
          <option value="manual">Manual</option>
          <option value="google">Google Review</option>
          <option value="video">Video Review</option>
        </ASelect>
      </div>
      <AField label="Video URL" value={values.videoUrl} onChange={(e) => setValues((v) => ({ ...v, videoUrl: e.target.value }))} />
      <AField label="Google Review URL" value={values.googleReviewUrl} onChange={(e) => setValues((v) => ({ ...v, googleReviewUrl: e.target.value }))} />
      <AToggle label="Featured" checked={values.featured} onChange={(featured) => setValues((v) => ({ ...v, featured }))} />
      <AToggle label="Published" checked={values.published} onChange={(published) => setValues((v) => ({ ...v, published }))} />
      <button type="submit" disabled={saving} className="w-full rounded-xl bg-gold py-3 text-sm font-semibold text-ivory transition-colors hover:bg-gold-deep disabled:opacity-60">
        {saving ? "Saving…" : testimonial ? "Save Changes" : "Create Testimonial"}
      </button>
    </form>
  );
}
