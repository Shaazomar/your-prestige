"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AField, ATextArea, AToggle } from "@/components/admin/FormField";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { albumSchema, type AlbumInput } from "./schema";
import { createAlbum, updateAlbum } from "./actions";
import { GalleryItemsEditor } from "./GalleryItemsEditor";
import type { AlbumRow } from "./actions";

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
}

const empty: AlbumInput = { title: "", slug: "", description: "", coverImage: "", sortOrder: 0, published: true };

export function AlbumForm({ album, onSuccess }: { album: AlbumRow | null; onSuccess: () => void }) {
  const [values, setValues] = useState<AlbumInput>(
    album
      ? { title: album.title, slug: album.slug, description: album.description ?? "", coverImage: album.coverImage ?? "", sortOrder: album.sortOrder, published: album.published }
      : empty
  );
  const [slugTouched, setSlugTouched] = useState(!!album);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = albumSchema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) fieldErrors[issue.path[0] as string] = issue.message;
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      if (album) {
        await updateAlbum(album.id, parsed.data);
        toast.success("Album updated");
      } else {
        await createAlbum(parsed.data);
        toast.success("Album created — you can now add images");
      }
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-5">
        <AField
          label="Title" required
          value={values.title}
          onChange={(e) => { const title = e.target.value; setValues((v) => ({ ...v, title, slug: slugTouched ? v.slug : slugify(title) })); }}
          error={errors.title}
        />
        <AField label="Slug" required value={values.slug} onChange={(e) => { setSlugTouched(true); setValues((v) => ({ ...v, slug: e.target.value })); }} error={errors.slug} />
        <ATextArea label="Description" value={values.description} onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))} />
        <ImageUploadField label="Cover Image" value={values.coverImage || null} onChange={(url) => setValues((v) => ({ ...v, coverImage: url ?? "" }))} />
        <AField label="Sort Order" type="number" value={values.sortOrder} onChange={(e) => setValues((v) => ({ ...v, sortOrder: Number(e.target.value) }))} />
        <AToggle label="Published" checked={values.published} onChange={(published) => setValues((v) => ({ ...v, published }))} />
        <button type="submit" disabled={saving} className="w-full rounded-xl bg-gold py-3 text-sm font-semibold text-ivory transition-colors hover:bg-gold-deep disabled:opacity-60">
          {saving ? "Saving…" : album ? "Save Changes" : "Create Album"}
        </button>
      </form>

      {album && (
        <div className="border-t border-white/8 pt-6">
          <p className="text-eyebrow mb-4 text-gold">Images</p>
          <GalleryItemsEditor albumId={album.id} />
        </div>
      )}
    </div>
  );
}
