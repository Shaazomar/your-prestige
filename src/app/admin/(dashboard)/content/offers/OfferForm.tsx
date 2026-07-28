"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AField, ATextArea, AToggle } from "@/components/admin/FormField";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { offerSchema, type OfferInput } from "./schema";
import { createOffer, updateOffer } from "./actions";
import type { Offer } from "@prisma/client";

const empty: OfferInput = { title: "", description: "", image: "", validFrom: "", validUntil: "", showCountdown: false, published: true };

export function OfferForm({ offer, onSuccess }: { offer: Offer | null; onSuccess: () => void }) {
  const [values, setValues] = useState<OfferInput>(
    offer
      ? {
          title: offer.title,
          description: offer.description ?? "",
          image: offer.image ?? "",
          validFrom: offer.validFrom ? offer.validFrom.toISOString().split("T")[0] : "",
          validUntil: offer.validUntil ? offer.validUntil.toISOString().split("T")[0] : "",
          showCountdown: offer.showCountdown,
          published: offer.published,
        }
      : empty
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = offerSchema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) fieldErrors[issue.path[0] as string] = issue.message;
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
      <AField label="Title" required value={values.title} onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))} error={errors.title} />
      <ATextArea label="Description" value={values.description} onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))} />
      <ImageUploadField label="Banner" value={values.image || null} onChange={(url) => setValues((v) => ({ ...v, image: url ?? "" }))} />
      <div className="grid grid-cols-2 gap-4">
        <AField label="Valid From" type="date" value={values.validFrom} onChange={(e) => setValues((v) => ({ ...v, validFrom: e.target.value }))} />
        <AField label="Valid Until" type="date" value={values.validUntil} onChange={(e) => setValues((v) => ({ ...v, validUntil: e.target.value }))} />
      </div>
      <AToggle label="Show Countdown" checked={values.showCountdown} onChange={(showCountdown) => setValues((v) => ({ ...v, showCountdown }))} hint="Displays a live countdown to the expiry date" />
      <AToggle label="Published" checked={values.published} onChange={(published) => setValues((v) => ({ ...v, published }))} />
      <button type="submit" disabled={saving} className="w-full rounded-xl bg-gold py-3 text-sm font-semibold text-ivory transition-colors hover:bg-gold-deep disabled:opacity-60">
        {saving ? "Saving…" : offer ? "Save Changes" : "Create Offer"}
      </button>
    </form>
  );
}
