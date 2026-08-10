"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AField, ATextArea, AToggle } from "@/components/admin/FormField";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { collectionSchema, type CollectionInput } from "./schema";
import { createCollection, updateCollection } from "./actions";
import type { CollectionRow } from "./actions";

import { Loader2 } from "lucide-react";

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

const empty: CollectionInput = {
  name: "",
  slug: "",
  description: "",
  image: "",
  sortOrder: 0,
  published: true,
};

export function CollectionForm({
  collection,
  onSuccess,
}: {
  collection: CollectionRow | null;
  onSuccess: () => void;
}) {
  const [values, setValues] = useState<CollectionInput>(
    collection
      ? {
          name: collection.name,
          slug: collection.slug,
          description: collection.description ?? "",
          image: collection.image ?? "",
          sortOrder: collection.sortOrder,
          published: collection.published,
        }
      : empty
  );
  const [slugTouched, setSlugTouched] = useState(!!collection);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = collectionSchema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        fieldErrors[issue.path[0] as string] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      if (collection) {
        await updateCollection(collection.id, parsed.data);
        toast.success("Collection updated");
      } else {
        await createCollection(parsed.data);
        toast.success("Collection created");
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
        label="Name"
        required
        value={values.name}
        onChange={(e) => {
          const name = e.target.value;
          setValues((v) => ({ ...v, name, slug: slugTouched ? v.slug : slugify(name) }));
        }}
        error={errors.name}
      />
      <AField
        label="Slug"
        required
        value={values.slug}
        onChange={(e) => {
          setSlugTouched(true);
          setValues((v) => ({ ...v, slug: e.target.value }));
        }}
        error={errors.slug}
        hint="Used in the URL — lowercase, hyphens only"
      />
      <ATextArea
        label="Description"
        value={values.description}
        onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
        error={errors.description}
      />
      <ImageUploadField
        label="Image"
        value={values.image || null}
        onChange={(url) => setValues((v) => ({ ...v, image: url ?? "" }))}
      />
      <AField
        label="Sort Order"
        type="number"
        value={values.sortOrder}
        onChange={(e) => setValues((v) => ({ ...v, sortOrder: Number(e.target.value) }))}
      />
      <AToggle
        label="Published"
        checked={values.published}
        onChange={(published) => setValues((v) => ({ ...v, published }))}
      />
      <button
        type="submit"
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-gold py-3 text-sm font-semibold text-ivory transition-colors hover:bg-gold-deep disabled:opacity-60"
      >
        {saving ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving…
          </>
        ) : (
          collection ? "Save Changes" : "Create Collection"
        )}
      </button>
    </form>
  );
}
