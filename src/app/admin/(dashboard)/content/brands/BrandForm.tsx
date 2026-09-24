"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { AField, ATextArea, AToggle } from "@/components/admin/FormField";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { VideoUploadField } from "@/components/admin/VideoUploadField";
import { brandSchema, type BrandInput } from "./schema";
import { createBrand, updateBrand, getBrandProductOptions } from "./actions";
import type { BrandRow } from "./actions";

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
}

const empty: BrandInput = {
  name: "",
  slug: "",
  logo: "",
  banner: "",
  mobileCoverImage: "",
  heroVideo: "",
  heroPoster: "",
  description: "",
  shortDescription: "",
  website: "",
  catalogPdf: "",
  featuredProductIds: [],
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
          mobileCoverImage: brand.mobileCoverImage ?? "",
          heroVideo: brand.heroVideo ?? "",
          heroPoster: brand.heroPoster ?? "",
          description: brand.description ?? "",
          shortDescription: brand.shortDescription ?? "",
          website: brand.website ?? "",
          catalogPdf: brand.catalogPdf ?? "",
          featuredProductIds: (brand.featuredProductIds as string[]) ?? [],
          featured: brand.featured,
          sortOrder: brand.sortOrder,
          published: brand.published,
        }
      : empty
  );
  const [slugTouched, setSlugTouched] = useState(!!brand);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState<{ id: string; name: string; collection: string | null }[]>([]);

  useEffect(() => {
    if (brand) getBrandProductOptions(brand.id).then(setProducts);
  }, [brand]);

  function toggleFeatured(id: string) {
    setValues((v) => ({
      ...v,
      featuredProductIds: v.featuredProductIds.includes(id)
        ? v.featuredProductIds.filter((x) => x !== id)
        : [...v.featuredProductIds, id],
    }));
  }

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
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="space-y-5">
        <p className="text-eyebrow text-gold">Overview</p>
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
          hint={brand ? `/brands/${values.slug}` : undefined}
        />
        <AField
          label="Short Description"
          value={values.shortDescription}
          onChange={(e) => setValues((v) => ({ ...v, shortDescription: e.target.value }))}
          hint="One line, shown on the brand card and hero — e.g. 'Complete Bathroom Solutions'"
        />
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
      </section>

      <section className="space-y-5 border-t border-white/8 pt-6">
        <p className="text-eyebrow text-gold">Media</p>
        <ImageUploadField scope="brands" ownerId={brand?.id ?? null} label="Logo" value={values.logo || null} onChange={(url) => setValues((v) => ({ ...v, logo: url ?? "" }))} aspect="aspect-square" />
        <ImageUploadField scope="brands" ownerId={brand?.id ?? null} label="Desktop Cover Image" value={values.banner || null} onChange={(url) => setValues((v) => ({ ...v, banner: url ?? "" }))} />
        <ImageUploadField scope="brands" ownerId={brand?.id ?? null}
          label="Mobile Cover Image"
          value={values.mobileCoverImage || null}
          onChange={(url) => setValues((v) => ({ ...v, mobileCoverImage: url ?? "" }))}
          aspect="aspect-[3/4]"
        />
        <VideoUploadField scope="brands" ownerId={brand?.id ?? null} label="Hero Video" value={values.heroVideo || null} onChange={(url) => setValues((v) => ({ ...v, heroVideo: url ?? "" }))} />
        <ImageUploadField scope="brands" ownerId={brand?.id ?? null}
          label="Video Poster"
          value={values.heroPoster || null}
          onChange={(url) => setValues((v) => ({ ...v, heroPoster: url ?? "" }))}
          aspect="aspect-video"
        />
        <p className="text-xs text-white/35">
          Video autoplays muted and loops on the brand page — it&apos;s optional. Without one, the cover image (or poster) is
          shown instead, so the page never depends on it loading.
        </p>
      </section>

      {brand && (
        <section className="space-y-3 border-t border-white/8 pt-6">
          <p className="text-eyebrow text-gold">Featured Products</p>
          <div className="max-h-44 space-y-1 overflow-y-auto rounded-xl border border-white/10 bg-white/5 p-2">
            {products.length === 0 && <p className="p-2 text-xs text-white/30">No products on this brand yet.</p>}
            {products.map((p) => (
              <label key={p.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-white/70 hover:bg-white/5">
                <input
                  type="checkbox"
                  checked={values.featuredProductIds.includes(p.id)}
                  onChange={() => toggleFeatured(p.id)}
                  className="accent-gold"
                />
                <span>
                  {p.name}
                  {p.collection && <span className="text-white/30"> · {p.collection}</span>}
                </span>
              </label>
            ))}
          </div>
          <p className="text-xs text-white/35">
            Left empty, the brand page automatically shows its own top products instead.
          </p>
        </section>
      )}

      <section className="space-y-3 border-t border-white/8 pt-6">
        <p className="text-eyebrow text-gold">SEO</p>
        <p className="text-xs text-white/50">
          Search title, description and social image for this page are managed in the SEO tool, keyed by path — search for{" "}
          <code className="rounded bg-white/10 px-1 py-0.5">/brands/{values.slug || "…"}</code>.
        </p>
        <Link
          href="/admin/seo"
          target="_blank"
          className="inline-flex items-center gap-1.5 text-sm text-gold hover:underline"
        >
          Open SEO Manager <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </section>

      <section className="space-y-5 border-t border-white/8 pt-6">
        <AField
          label="Sort Order"
          type="number"
          value={values.sortOrder}
          onChange={(e) => setValues((v) => ({ ...v, sortOrder: Number(e.target.value) }))}
        />
        <AToggle label="Featured on homepage" checked={values.featured} onChange={(featured) => setValues((v) => ({ ...v, featured }))} />
        <AToggle label="Published" checked={values.published} onChange={(published) => setValues((v) => ({ ...v, published }))} />
      </section>

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
