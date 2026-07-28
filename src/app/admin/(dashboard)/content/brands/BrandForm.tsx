"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AField, ATextArea, AToggle } from "@/components/admin/FormField";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { brandSchema, type BrandInput } from "./schema";
import { createBrand, updateBrand } from "./actions";
import type { BrandRow } from "./actions";

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
}

const empty: BrandInput = {
  name: "",
  slug: "",
  logo: "",
  banner: "",
  description: "",
  website: "",
  catalogPdf: "",
  featured: false,
  sortOrder: 0,
  published: true,
};

export function BrandForm({ brand, onSuccess }: { brand: BrandRow | null; onSuccess: () => void }) {
  const [values, setValues] = useState<BrandInput>(
    brand
      ? {
          name: brand.name,
          slug: brand.slug,
          logo: brand.logo ?? "",
          banner: brand.banner ?? "",
          description: brand.description ?? "",
          website: brand.website ?? "",
          catalogPdf: brand.catalogPdf ?? "",
          featured: brand.featured,
          sortOrder: brand.sortOrder,
          published: brand.published,
        }
      : empty
  );
  const [slugTouched, setSlugTouched] = useState(!!brand);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = brandSchema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) fieldErrors[issue.path[0] as string] = issue.message;
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      if (brand) {
        await updateBrand(brand.id, parsed.data);
        toast.success("Brand updated");
      } else {
        await createBrand(parsed.data);
        toast.success("Brand created");
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
      />
      <ImageUploadField label="Logo" value={values.logo || null} onChange={(url) => setValues((v) => ({ ...v, logo: url ?? "" }))} aspect="aspect-square" />
      <ImageUploadField label="Banner" value={values.banner || null} onChange={(url) => setValues((v) => ({ ...v, banner: url ?? "" }))} />
      <ATextArea
        label="Description"
        value={values.description}
        onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
      />
      <AField
        label="Website"
        type="url"
        value={values.website}
        onChange={(e) => setValues((v) => ({ ...v, website: e.target.value }))}
        placeholder="https://…"
      />
      <AField
        label="Catalog PDF URL"
        value={values.catalogPdf}
        onChange={(e) => setValues((v) => ({ ...v, catalogPdf: e.target.value }))}
        hint="Upload the PDF to Media Library first, then paste its URL here"
      />
      <AField
        label="Sort Order"
        type="number"
        value={values.sortOrder}
        onChange={(e) => setValues((v) => ({ ...v, sortOrder: Number(e.target.value) }))}
      />
      <AToggle label="Featured on homepage" checked={values.featured} onChange={(featured) => setValues((v) => ({ ...v, featured }))} />
      <AToggle label="Published" checked={values.published} onChange={(published) => setValues((v) => ({ ...v, published }))} />
      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-xl bg-gold py-3 text-sm font-semibold text-ivory transition-colors hover:bg-gold-deep disabled:opacity-60"
      >
        {saving ? "Saving…" : brand ? "Save Changes" : "Create Brand"}
      </button>
    </form>
  );
}
