"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AField, ATextArea, AToggle, ASelect } from "@/components/admin/FormField";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { collectionSchema, type CollectionInput } from "./schema";
import {
  createCollection,
  updateCollection,
  getCollectionBrandOptions,
  getCollectionProductOptions,
  getCollectionProductIds,
  setCollectionProducts,
} from "./actions";
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
  brandId: null,
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
          brandId: collection.brandId,
          sortOrder: collection.sortOrder,
          published: collection.published,
        }
      : empty
  );
  const [slugTouched, setSlugTouched] = useState(!!collection);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([]);
  const [products, setProducts] = useState<{ id: string; name: string; collection: string | null }[]>([]);
  const [productIds, setProductIds] = useState<string[]>([]);

  useEffect(() => {
    getCollectionBrandOptions().then(setBrands);
  }, []);

  // Product options are scoped to the selected brand — reload whenever it changes.
  useEffect(() => {
    getCollectionProductOptions(values.brandId).then(setProducts);
  }, [values.brandId]);

  useEffect(() => {
    if (collection) getCollectionProductIds(collection.id).then(setProductIds);
  }, [collection]);

  function toggleProduct(id: string) {
    setProductIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  }

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
      const saved = collection
        ? await updateCollection(collection.id, parsed.data)
        : await createCollection(parsed.data);
      await setCollectionProducts(saved.id, productIds);
      toast.success(collection ? "Collection updated" : "Collection created");
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
      <ImageUploadField scope="collections" ownerId={collection?.id ?? null}
        label="Image"
        value={values.image || null}
        onChange={(url) => setValues((v) => ({ ...v, image: url ?? "" }))}
      />
      <ASelect
        label="Brand"
        value={values.brandId ?? ""}
        onChange={(e) => setValues((v) => ({ ...v, brandId: e.target.value || null }))}
      >
        <option value="">Unassigned</option>
        {brands.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </ASelect>
      <p className="-mt-3 text-xs text-white/35">
        Assign a brand to feature this as one of that brand&apos;s Featured Collections (e.g. Jaquar → &quot;Signature Bath&quot;).
      </p>

      <div>
        <span className="mb-1.5 block text-sm font-medium text-white/70">Products</span>
        <div className="max-h-44 space-y-1 overflow-y-auto rounded-xl border border-white/10 bg-white/5 p-2">
          {products.length === 0 && <p className="p-2 text-xs text-white/30">No products{values.brandId ? " on this brand" : ""} yet.</p>}
          {products.map((p) => (
            <label key={p.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-white/70 hover:bg-white/5">
              <input
                type="checkbox"
                checked={productIds.includes(p.id)}
                onChange={() => toggleProduct(p.id)}
                className="accent-gold"
              />
              <span>
                {p.name}
                {p.collection && <span className="text-white/30"> · {p.collection}</span>}
              </span>
            </label>
          ))}
        </div>
        <p className="mt-1.5 text-xs text-white/35">{productIds.length} product{productIds.length === 1 ? "" : "s"} in this collection.</p>
      </div>

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
