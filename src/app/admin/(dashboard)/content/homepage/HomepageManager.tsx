"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ExternalLink, Loader2, Rocket, CheckCircle2 } from "lucide-react";
import { AField, ATextArea } from "@/components/admin/FormField";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { VideoUploadField } from "@/components/admin/VideoUploadField";
import { homepageHeroSchema, type HomepageHeroInput } from "./schema";
import { getHomepageDraft, saveHomepageDraft, publishHomepage, isHomepagePublished } from "./actions";

export function HomepageManager({ canPublish }: { canPublish: boolean }) {
  const [values, setValues] = useState<HomepageHeroInput | null>(null);
  const [published, setPublished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    getHomepageDraft().then(setValues);
    isHomepagePublished().then(setPublished);
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!values) return;
    const parsed = homepageHeroSchema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) fieldErrors[issue.path[0] as string] = issue.message;
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      await saveHomepageDraft(parsed.data);
      setPublished(false);
      toast.success("Draft saved");
    } catch {
      toast.error("Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    setPublishing(true);
    try {
      await publishHomepage();
      setPublished(true);
      toast.success("Homepage published — live now");
    } catch {
      toast.error("Publish failed");
    } finally {
      setPublishing(false);
    }
  }

  if (!values) {
    return (
      <div className="flex h-48 items-center justify-center rounded-2xl border border-white/8 bg-[#141413]">
        <Loader2 className="h-6 w-6 animate-spin text-white/30" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-[#141413] p-5">
        <div className="flex items-center gap-2 text-sm">
          {published ? (
            <span className="flex items-center gap-1.5 text-emerald-300"><CheckCircle2 className="h-4 w-4" /> Draft matches live site</span>
          ) : (
            <span className="flex items-center gap-1.5 text-gold"><Rocket className="h-4 w-4" /> Unpublished changes</span>
          )}
        </div>
        <div className="flex gap-2">
          <a href="/?preview=1" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-xl border border-white/10 px-4 py-2 text-xs font-medium text-white/70 transition-colors hover:border-gold hover:text-gold">
            <ExternalLink className="h-3.5 w-3.5" /> Preview
          </a>
          {canPublish && (
            <button onClick={handlePublish} disabled={publishing || published} className="flex items-center gap-1.5 rounded-xl bg-gold px-4 py-2 text-xs font-semibold text-ivory transition-colors hover:bg-gold-deep disabled:opacity-50">
              <Rocket className="h-3.5 w-3.5" /> {publishing ? "Publishing…" : "Publish"}
            </button>
          )}
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-5 rounded-2xl border border-white/8 bg-[#141413] p-6">
        <p className="text-sm font-medium text-white/70">Hero Section</p>
        <AField label="Eyebrow" value={values.eyebrow} onChange={(e) => setValues((v) => v && { ...v, eyebrow: e.target.value })} />
        <AField label="Heading" required value={values.heading} onChange={(e) => setValues((v) => v && { ...v, heading: e.target.value })} error={errors.heading} />
        <ATextArea label="Subheading" value={values.subheading} onChange={(e) => setValues((v) => v && { ...v, subheading: e.target.value })} />
        <ImageUploadField label="Hero Image" value={values.heroImage || null} onChange={(url) => setValues((v) => v && { ...v, heroImage: url ?? "" })} />
        <VideoUploadField label="Hero Video (optional, overrides image)" value={values.heroVideo || null} onChange={(url) => setValues((v) => v && { ...v, heroVideo: url ?? "" })} />
        <div className="grid grid-cols-2 gap-4">
          <AField label="Primary Button Label" value={values.primaryCtaLabel} onChange={(e) => setValues((v) => v && { ...v, primaryCtaLabel: e.target.value })} />
          <AField label="Primary Button Link" value={values.primaryCtaHref} onChange={(e) => setValues((v) => v && { ...v, primaryCtaHref: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <AField label="Secondary Button Label" value={values.secondaryCtaLabel} onChange={(e) => setValues((v) => v && { ...v, secondaryCtaLabel: e.target.value })} />
          <AField label="Secondary Button Link" value={values.secondaryCtaHref} onChange={(e) => setValues((v) => v && { ...v, secondaryCtaHref: e.target.value })} />
        </div>
        <button type="submit" disabled={saving} className="w-full rounded-xl border border-white/15 py-3 text-sm font-semibold text-white transition-colors hover:border-gold hover:text-gold disabled:opacity-60">
          {saving ? "Saving…" : "Save Draft"}
        </button>
      </form>
    </div>
  );
}
