"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AField, ATextArea, ASelect, AToggle } from "@/components/admin/FormField";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { videoSchema, type VideoInput } from "./schema";
import { createVideo, updateVideo } from "./actions";
import type { Video } from "@prisma/client";

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
}

const empty: VideoInput = { title: "", slug: "", description: "", provider: "YOUTUBE", url: "", thumbnail: "", category: "", featured: false, published: true, sortOrder: 0 };

export function VideoForm({ video, onSuccess }: { video: Video | null; onSuccess: () => void }) {
  const [values, setValues] = useState<VideoInput>(
    video
      ? { title: video.title, slug: video.slug, description: video.description ?? "", provider: video.provider, url: video.url, thumbnail: video.thumbnail ?? "", category: video.category ?? "", featured: video.featured, published: video.published, sortOrder: video.sortOrder }
      : empty
  );
  const [slugTouched, setSlugTouched] = useState(!!video);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = videoSchema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) fieldErrors[issue.path[0] as string] = issue.message;
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      if (video) {
        await updateVideo(video.id, parsed.data);
        toast.success("Video updated");
      } else {
        await createVideo(parsed.data);
        toast.success("Video created");
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
      <AField
        label="Title" required
        value={values.title}
        onChange={(e) => { const title = e.target.value; setValues((v) => ({ ...v, title, slug: slugTouched ? v.slug : slugify(title) })); }}
        error={errors.title}
      />
      <AField label="Slug" required value={values.slug} onChange={(e) => { setSlugTouched(true); setValues((v) => ({ ...v, slug: e.target.value })); }} error={errors.slug} />
      <ATextArea label="Description" value={values.description} onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))} />
      <div className="grid grid-cols-2 gap-4">
        <ASelect label="Provider" value={values.provider} onChange={(e) => setValues((v) => ({ ...v, provider: e.target.value as VideoInput["provider"] }))}>
          <option value="YOUTUBE">YouTube</option>
          <option value="VIMEO">Vimeo</option>
          <option value="UPLOAD">Direct Upload</option>
        </ASelect>
        <AField label="Category" value={values.category} onChange={(e) => setValues((v) => ({ ...v, category: e.target.value }))} placeholder="Showroom, Testimonial…" />
      </div>
      <AField label="Video URL" required value={values.url} onChange={(e) => setValues((v) => ({ ...v, url: e.target.value }))} error={errors.url} placeholder="https://youtube.com/watch?v=…" />
      <ImageUploadField label="Thumbnail" value={values.thumbnail || null} onChange={(url) => setValues((v) => ({ ...v, thumbnail: url ?? "" }))} />
      <AField label="Sort Order" type="number" value={values.sortOrder} onChange={(e) => setValues((v) => ({ ...v, sortOrder: Number(e.target.value) }))} />
      <AToggle label="Featured" checked={values.featured} onChange={(featured) => setValues((v) => ({ ...v, featured }))} />
      <AToggle label="Published" checked={values.published} onChange={(published) => setValues((v) => ({ ...v, published }))} />
      <button type="submit" disabled={saving} className="w-full rounded-xl bg-gold py-3 text-sm font-semibold text-ivory transition-colors hover:bg-gold-deep disabled:opacity-60">
        {saving ? "Saving…" : video ? "Save Changes" : "Create Video"}
      </button>
    </form>
  );
}
