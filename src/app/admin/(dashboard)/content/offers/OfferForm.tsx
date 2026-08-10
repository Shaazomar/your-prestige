"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { AField, ATextArea, ASelect, AToggle } from "@/components/admin/FormField";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { offerSchema, type OfferInput } from "./schema";
import { createOffer, updateOffer, getOfferFormOptions, type OfferRow } from "./actions";

const empty: OfferInput = {
  name: "",
  type: "PRODUCT",
  productId: null,
  collectionId: null,
  categoryId: null,
  originalPrice: null,
  offerPrice: null,
  discountPercentage: null,
  startDate: "",
  endDate: "",
  banner: "",
  description: "",
  status: "ACTIVE",
  priority: 0,
  featured: false,
};

export function OfferForm({
  offer,
  onSuccess,
}: {
  offer: OfferRow | null;
  onSuccess: () => void;
}) {
  const [values, setValues] = useState<OfferInput>(
    offer
      ? {
          name: offer.name,
          type: offer.type,
          productId: offer.productId,
          collectionId: offer.collectionId,
          categoryId: offer.categoryId,
          originalPrice: offer.originalPrice ? Number(offer.originalPrice) : null,
          offerPrice: offer.offerPrice ? Number(offer.offerPrice) : null,
          discountPercentage: offer.discountPercentage ?? null,
          startDate: offer.startDate ? offer.startDate.toISOString().split("T")[0] : "",
          endDate: offer.endDate ? offer.endDate.toISOString().split("T")[0] : "",
          banner: offer.banner ?? "",
          description: offer.description ?? "",
          status: offer.status as "ACTIVE" | "INACTIVE" | "SCHEDULED",
          priority: offer.priority,
          featured: offer.featured,
        }
      : empty
  );

  const [options, setOptions] = useState<{
    products: { id: string; name: string; price: number | null }[];
    collections: { id: string; name: string }[];
    categories: { id: string; name: string }[];
  }>({ products: [], collections: [], categories: [] });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getOfferFormOptions().then(setOptions);
  }, []);

  // Auto-calculate discount or prices when prices change
  useEffect(() => {
    if (values.originalPrice && values.offerPrice) {
      const pct = Math.round(((values.originalPrice - values.offerPrice) / values.originalPrice) * 100);
      if (pct >= 0 && pct !== values.discountPercentage) {
        setValues((v) => ({ ...v, discountPercentage: pct }));
      }
    }
  }, [values.originalPrice, values.offerPrice, values.discountPercentage]);

  // Set original price when product is selected
  function handleProductChange(prodId: string) {
    const prod = options.products.find((p) => p.id === prodId);
    setValues((v) => ({
      ...v,
      productId: prodId || null,
      originalPrice: prod?.price || null,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = offerSchema.safeParse(values);
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
      if (offer) {
        await updateOffer(offer.id, parsed.data);
        toast.success("Offer updated");
      } else {
        await createOffer(parsed.data);
        toast.success("Offer created");
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
        label="Offer Name"
        required
        value={values.name}
        onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
        error={errors.name}
      />

      <ASelect
        label="Offer Type"
        value={values.type}
        onChange={(e) =>
          setValues((v) => ({
            ...v,
            type: e.target.value as typeof values.type,
            productId: null,
            collectionId: null,
            categoryId: null,
          }))
        }
      >
        <option value="PRODUCT">Product Offer</option>
        <option value="COLLECTION">Collection Offer</option>
        <option value="CATEGORY">Category Offer</option>
        <option value="SEASONAL">Seasonal Offer</option>
        <option value="FESTIVAL">Festival Offer</option>
        <option value="LIMITED_TIME">Limited-Time Offer</option>
        <option value="FEATURED">Featured Offer</option>
      </ASelect>

      {values.type === "PRODUCT" && (
        <ASelect
          label="Target Product"
          value={values.productId ?? ""}
          onChange={(e) => handleProductChange(e.target.value)}
        >
          <option value="">Select a Product</option>
          {options.products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} {p.price ? `(₹${p.price})` : ""}
            </option>
          ))}
        </ASelect>
      )}

      {values.type === "COLLECTION" && (
        <ASelect
          label="Target Collection"
          value={values.collectionId ?? ""}
          onChange={(e) => setValues((v) => ({ ...v, collectionId: e.target.value || null }))}
        >
          <option value="">Select a Collection</option>
          {options.collections.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </ASelect>
      )}

      {values.type === "CATEGORY" && (
        <ASelect
          label="Target Category"
          value={values.categoryId ?? ""}
          onChange={(e) => setValues((v) => ({ ...v, categoryId: e.target.value || null }))}
        >
          <option value="">Select a Category</option>
          {options.categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </ASelect>
      )}

      {(values.type === "PRODUCT" || values.type === "COLLECTION" || values.type === "CATEGORY") && (
        <div className="grid grid-cols-3 gap-4">
          <AField
            label="Original Price (₹)"
            type="number"
            value={values.originalPrice ?? ""}
            onChange={(e) => setValues((v) => ({ ...v, originalPrice: e.target.value ? Number(e.target.value) : null }))}
          />
          <AField
            label="Offer Price (₹)"
            type="number"
            value={values.offerPrice ?? ""}
            onChange={(e) => setValues((v) => ({ ...v, offerPrice: e.target.value ? Number(e.target.value) : null }))}
          />
          <AField
            label="Discount %"
            type="number"
            value={values.discountPercentage ?? ""}
            onChange={(e) => setValues((v) => ({ ...v, discountPercentage: e.target.value ? Number(e.target.value) : null }))}
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <AField
          label="Start Date"
          type="date"
          value={values.startDate ?? ""}
          onChange={(e) => setValues((v) => ({ ...v, startDate: e.target.value }))}
        />
        <AField
          label="End Date"
          type="date"
          value={values.endDate ?? ""}
          onChange={(e) => setValues((v) => ({ ...v, endDate: e.target.value }))}
        />
      </div>

      <ImageUploadField
        label="Offer Banner"
        value={values.banner || null}
        onChange={(url) => setValues((v) => ({ ...v, banner: url ?? "" }))}
      />

      <ATextArea
        label="Description"
        value={values.description}
        onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
      />

      <div className="grid grid-cols-2 gap-4">
        <ASelect
          label="Status"
          value={values.status}
          onChange={(e) => setValues((v) => ({ ...v, status: e.target.value as typeof values.status }))}
        >
          <option value="ACTIVE">ACTIVE</option>
          <option value="INACTIVE">INACTIVE</option>
          <option value="SCHEDULED">SCHEDULED</option>
        </ASelect>
        <AField
          label="Priority Order"
          type="number"
          value={values.priority}
          onChange={(e) => setValues((v) => ({ ...v, priority: Number(e.target.value) }))}
        />
      </div>

      <AToggle
        label="Featured Offer"
        checked={values.featured}
        onChange={(featured) => setValues((v) => ({ ...v, featured }))}
        hint="Pointers this offer at the top of the promotions panel"
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
          offer ? "Save Changes" : "Create Offer"
        )}
      </button>
    </form>
  );
}
