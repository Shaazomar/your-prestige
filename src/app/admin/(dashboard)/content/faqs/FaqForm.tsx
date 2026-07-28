"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AField, ATextArea, AToggle } from "@/components/admin/FormField";
import { faqSchema, type FaqInput } from "./schema";
import { createFaq, updateFaq } from "./actions";
import type { Faq } from "@prisma/client";

const empty: FaqInput = { question: "", answer: "", category: "", sortOrder: 0, published: true };

export function FaqForm({ faq, onSuccess }: { faq: Faq | null; onSuccess: () => void }) {
  const [values, setValues] = useState<FaqInput>(
    faq ? { question: faq.question, answer: faq.answer, category: faq.category ?? "", sortOrder: faq.sortOrder, published: faq.published } : empty
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = faqSchema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) fieldErrors[issue.path[0] as string] = issue.message;
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      if (faq) {
        await updateFaq(faq.id, parsed.data);
        toast.success("FAQ updated");
      } else {
        await createFaq(parsed.data);
        toast.success("FAQ created");
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
      <AField label="Question" required value={values.question} onChange={(e) => setValues((v) => ({ ...v, question: e.target.value }))} error={errors.question} />
      <ATextArea label="Answer" required value={values.answer} onChange={(e) => setValues((v) => ({ ...v, answer: e.target.value }))} error={errors.answer} />
      <div className="grid grid-cols-2 gap-4">
        <AField label="Category" value={values.category} onChange={(e) => setValues((v) => ({ ...v, category: e.target.value }))} />
        <AField label="Sort Order" type="number" value={values.sortOrder} onChange={(e) => setValues((v) => ({ ...v, sortOrder: Number(e.target.value) }))} />
      </div>
      <AToggle label="Published" checked={values.published} onChange={(published) => setValues((v) => ({ ...v, published }))} />
      <button type="submit" disabled={saving} className="w-full rounded-xl bg-gold py-3 text-sm font-semibold text-ivory transition-colors hover:bg-gold-deep disabled:opacity-60">
        {saving ? "Saving…" : faq ? "Save Changes" : "Create FAQ"}
      </button>
    </form>
  );
}
