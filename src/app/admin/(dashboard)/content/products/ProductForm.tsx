"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AField, ATextArea, ASelect, AToggle, ATagInput } from "@/components/admin/FormField";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { MultiImageField } from "@/components/admin/MultiImageField";
import { productSchema, type ProductInput } from "./schema";
import { createProduct, updateProduct, getProductFormOptions } from "./actions";
import type { ProductRow } from "./actions";

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
}

const empty: ProductInput = {
  name: "", slug: "", collection: "", description: "", finish: "", thickness: "",
  sizes: [], material: "", color: "", texture: "", applications: [],
  lifestyleImage: "", textureImage: "", images: [], video: "", brochureUrl: "",
  tag: "", aspect: "square", relatedIds: [], categoryId: null, brandId: null,
  featured: false, designerPick: false, published: true, priceIndicator: "",
};

export function ProductForm({ product, onSuccess }: { product: ProductRow | null; onSuccess: () => void }) {
  const [values, setValues] = useState<ProductInput>(
    product
      ? {
          name: product.name,
          slug: product.slug,
          collection: product.collection ?? "",
          description: product.description ?? "",
          finish: product.finish ?? "",
          thickness: product.thickness ?? "",
          sizes: (product.sizes as string[]) ?? [],
          material: product.material ?? "",
          color: product.color ?? "",
          texture: product.texture ?? "",
          applications: (product.applications as string[]) ?? [],
          lifestyleImage: product.lifestyleImage ?? "",
          textureImage: product.textureImage ?? "",
          images: (product.images as string[]) ?? [],
          video: product.video ?? "",
          brochureUrl: product.brochureUrl ?? "",
          tag: product.tag ?? "",
          aspect: (product.aspect as "portrait" | "square" | "landscape") ?? "square",
          relatedIds: (product.relatedIds as string[]) ?? [],
          categoryId: product.categoryId,
          brandId: product.brandId,
          featured: product.featured,
          designerPick: product.designerPick,
          published: product.published,
          priceIndicator: product.priceIndicator ?? "",
        }
      : empty
  );
  const [slugTouched, setSlugTouched] = useState(!!product);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [options, setOptions] = useState<{
    categories: { id: string; name: string }[];
    brands: { id: string; name: string }[];
    products: { id: string; name: string }[];
  }>({ categories: [], brands: [], products: [] });

  useEffect(() => {
    getProductFormOptions(product?.id).then(setOptions);
  }, [product?.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = productSchema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) fieldErrors[issue.path[0] as string] = issue.message;
      setErrors(fieldErrors);
      toast.error("Please fix the highlighted fields");
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      if (product) {
        await updateProduct(product.id, parsed.data);
        toast.success("Product updated");
      } else {
        await createProduct(parsed.data);
        toast.success("Product created");
      }
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  function toggleRelated(id: string) {
    setValues((v) => ({
      ...v,
      relatedIds: v.relatedIds.includes(id) ? v.relatedIds.filter((x) => x !== id) : [...v.relatedIds, id],
    }));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="space-y-5">
        <p className="text-eyebrow text-gold">Identity</p>
        <div className="grid grid-cols-2 gap-4">
          <AField
            label="Name" required
            value={values.name}
            onChange={(e) => { const name = e.target.value; setValues((v) => ({ ...v, name, slug: slugTouched ? v.slug : slugify(name) })); }}
            error={errors.name}
          />
          <AField label="Slug" required value={values.slug} onChange={(e) => { setSlugTouched(true); setValues((v) => ({ ...v, slug: e.target.value })); }} error={errors.slug} />
        </div>
        <AField label="Collection" value={values.collection} onChange={(e) => setValues((v) => ({ ...v, collection: e.target.value }))} placeholder="e.g. Lumina Marble Collection" />
        <ATextArea label="Description" value={values.description} onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))} />
      </section>

      <section className="space-y-5 border-t border-white/8 pt-6">
        <p className="text-eyebrow text-gold">Specifications</p>
        <div className="grid grid-cols-2 gap-4">
          <AField label="Finish" value={values.finish} onChange={(e) => setValues((v) => ({ ...v, finish: e.target.value }))} />
          <AField label="Thickness" value={values.thickness} onChange={(e) => setValues((v) => ({ ...v, thickness: e.target.value }))} />
          <AField label="Material" value={values.material} onChange={(e) => setValues((v) => ({ ...v, material: e.target.value }))} />
          <AField label="Color" value={values.color} onChange={(e) => setValues((v) => ({ ...v, color: e.target.value }))} />
        </div>
        <AField label="Texture" value={values.texture} onChange={(e) => setValues((v) => ({ ...v, texture: e.target.value }))} hint="Short descriptor, e.g. 'Book-matched veining'" />
        <ATagInput label="Sizes" value={values.sizes} onChange={(sizes) => setValues((v) => ({ ...v, sizes }))} placeholder="600 × 1200 mm, 800 × 1600 mm" />
        <ATagInput label="Applications" value={values.applications} onChange={(applications) => setValues((v) => ({ ...v, applications }))} placeholder="Living Room, Bathroom, Outdoor" />
      </section>

      <section className="space-y-5 border-t border-white/8 pt-6">
        <p className="text-eyebrow text-gold">Media</p>
        <ImageUploadField label="Lifestyle Image (hero/card)" value={values.lifestyleImage || null} onChange={(url) => setValues((v) => ({ ...v, lifestyleImage: url ?? "" }))} aspect="aspect-[4/5]" />
        <ImageUploadField label="Texture Close-up" value={values.textureImage || null} onChange={(url) => setValues((v) => ({ ...v, textureImage: url ?? "" }))} />
        <MultiImageField label="Gallery" value={values.images} onChange={(images) => setValues((v) => ({ ...v, images }))} />
        <div className="grid grid-cols-2 gap-4">
          <AField label="Video URL" value={values.video} onChange={(e) => setValues((v) => ({ ...v, video: e.target.value }))} />
          <AField label="Catalog PDF URL" value={values.brochureUrl} onChange={(e) => setValues((v) => ({ ...v, brochureUrl: e.target.value }))} />
        </div>
      </section>

      <section className="space-y-5 border-t border-white/8 pt-6">
        <p className="text-eyebrow text-gold">Organisation</p>
        <div className="grid grid-cols-2 gap-4">
          <ASelect label="Category" value={values.categoryId ?? ""} onChange={(e) => setValues((v) => ({ ...v, categoryId: e.target.value || null }))}>
            <option value="">None</option>
            {options.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </ASelect>
          <ASelect label="Brand" value={values.brandId ?? ""} onChange={(e) => setValues((v) => ({ ...v, brandId: e.target.value || null }))}>
            <option value="">None</option>
            {options.brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </ASelect>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <ASelect label="Tag" value={values.tag} onChange={(e) => setValues((v) => ({ ...v, tag: e.target.value }))}>
            <option value="">None</option>
            <option value="Bestseller">Bestseller</option>
            <option value="New Arrival">New Arrival</option>
            <option value="Designer Pick">Designer Pick</option>
            <option value="Premium">Premium</option>
            <option value="Limited">Limited</option>
          </ASelect>
          <ASelect label="Card Aspect" value={values.aspect} onChange={(e) => setValues((v) => ({ ...v, aspect: e.target.value as ProductInput["aspect"] }))}>
            <option value="portrait">Portrait</option>
            <option value="square">Square</option>
            <option value="landscape">Landscape</option>
          </ASelect>
        </div>
        <AField label="Price Indicator" value={values.priceIndicator} onChange={(e) => setValues((v) => ({ ...v, priceIndicator: e.target.value }))} placeholder="₹₹₹" hint="Luxury catalogue, not ecommerce" />

        <div>
          <span className="mb-1.5 block text-sm font-medium text-white/70">Related Products</span>
          <div className="max-h-40 space-y-1 overflow-y-auto rounded-xl border border-white/10 bg-white/5 p-2">
            {options.products.length === 0 && <p className="p-2 text-xs text-white/30">No other products yet.</p>}
            {options.products.map((p) => (
              <label key={p.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-white/70 hover:bg-white/5">
                <input type="checkbox" checked={values.relatedIds.includes(p.id)} onChange={() => toggleRelated(p.id)} className="accent-gold" />
                {p.name}
              </label>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-3 border-t border-white/8 pt-6">
        <AToggle label="Featured" checked={values.featured} onChange={(featured) => setValues((v) => ({ ...v, featured }))} />
        <AToggle label="Designer Pick" checked={values.designerPick} onChange={(designerPick) => setValues((v) => ({ ...v, designerPick }))} />
        <AToggle label="Published" checked={values.published} onChange={(published) => setValues((v) => ({ ...v, published }))} />
      </section>

      <button type="submit" disabled={saving} className="w-full rounded-xl bg-gold py-3 text-sm font-semibold text-ivory transition-colors hover:bg-gold-deep disabled:opacity-60">
        {saving ? "Saving…" : product ? "Save Changes" : "Create Product"}
      </button>
    </form>
  );
}
