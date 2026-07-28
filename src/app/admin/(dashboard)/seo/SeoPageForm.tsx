"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AField, ATextArea, AToggle } from "@/components/admin/FormField";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { seoSchema, type SeoInput } from "./schema";
import { createSeoPage, updateSeoPage } from "./actions";
import type { Seo } from "@prisma/client";

const empty: SeoInput = { path: "", title: "", description: "", keywords: "", canonical: "", ogImage: "", jsonLd: "", noIndex: false };

export function SeoPageForm({ page, onSuccess }: { page: Seo | null; onSuccess: () => void }) {
  const [values, setValues] = useState<SeoInput>(
    page
      ? { path: page.path, title: page.title ?? "", description: page.description ?? "", keywords: page.keywords ?? "", canonical: page.canonical ?? "", ogImage: page.ogImage ?? "", jsonLd: page.jsonLd ?? "", noIndex: page.noIndex }
      : empty
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = seoSchema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) fieldErrors[issue.path[0] as string] = issue.message;
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      if (page) {
        await updateSeoPage(page.id, parsed.data);
        toast.success("SEO updated");
      } else {
        await createSeoPage(parsed.data);
        toast.success("SEO entry created");
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
      <AField label="Path" required value={values.path} onChange={(e) => setValues((v) => ({ ...v, path: e.target.value }))} error={errors.path} placeholder="/about" disabled={!!page} hint={page ? undefined : "Cannot be changed after creation"} />
      <AField label="Meta Title" value={values.title} onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))} />
      <ATextArea label="Meta Description" value={values.description} onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))} />
      <AField label="Keywords" value={values.keywords} onChange={(e) => setValues((v) => ({ ...v, keywords: e.target.value }))} hint="Comma-separated" />
      <AField label="Canonical URL" value={values.canonical} onChange={(e) => setValues((v) => ({ ...v, canonical: e.target.value }))} />
      <ImageUploadField label="OpenGraph Image" value={values.ogImage || null} onChange={(url) => setValues((v) => ({ ...v, ogImage: url ?? "" }))} />
      <ATextArea label="JSON-LD Override" value={values.jsonLd} onChange={(e) => setValues((v) => ({ ...v, jsonLd: e.target.value }))} className="min-h-32 font-mono text-xs" hint="Raw JSON — leave blank to use the default schema" />
      <AToggle label="No Index" checked={values.noIndex} onChange={(noIndex) => setValues((v) => ({ ...v, noIndex }))} hint="Hides this page from search engines" />
      <button type="submit" disabled={saving} className="w-full rounded-xl bg-gold py-3 text-sm font-semibold text-ivory transition-colors hover:bg-gold-deep disabled:opacity-60">
        {saving ? "Saving…" : page ? "Save Changes" : "Create SEO Entry"}
      </button>
    </form>
  );
}
