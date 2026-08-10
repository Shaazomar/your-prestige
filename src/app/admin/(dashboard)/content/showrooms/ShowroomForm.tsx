"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AField, ATextArea, AToggle, ATagInput } from "@/components/admin/FormField";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { VideoUploadField } from "@/components/admin/VideoUploadField";
import { MultiImageField } from "@/components/admin/MultiImageField";
import { showroomSchema, type ShowroomInput } from "./schema";
import { createShowroom, updateShowroom, getShowroomProductOptions } from "./actions";
import type { ShowroomRow } from "./actions";

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
}

const empty: ShowroomInput = {
  name: "", slug: "", subtitle: "",
  addressLine: "", locality: "", city: "", state: "Karnataka", postalCode: "",
  latitude: null, longitude: null, mapUrl: "", mapEmbedUrl: "", directions: "",
  phone: "", whatsapp: "", email: "", managerName: "", managerPhone: "",
  hoursWeekdays: "Monday–Saturday: 9:00 AM – 7:00 PM", hoursSunday: "Sunday: Closed",
  heroImage: "", gallery: [], video: "",
  description: "", brands: [], amenities: [], featuredProductIds: [],
  isFlagship: false, published: true, sortOrder: 0,
  googlePlaceId: "", googleReviewUrl: "", googleWriteReviewUrl: "",
  googleRating: undefined, googleReviewCount: 0, googlePhotos: [],
};

export function ShowroomForm({
  showroom,
  onSuccess,
}: {
  showroom: ShowroomRow | null;
  onSuccess: () => void;
}) {
  const [values, setValues] = useState<ShowroomInput>(
    showroom
      ? {
          name: showroom.name,
          slug: showroom.slug,
          subtitle: showroom.subtitle ?? "",
          addressLine: showroom.addressLine,
          locality: showroom.locality ?? "",
          city: showroom.city,
          state: showroom.state,
          postalCode: showroom.postalCode ?? "",
          latitude: showroom.latitude,
          longitude: showroom.longitude,
          mapUrl: showroom.mapUrl ?? "",
          mapEmbedUrl: showroom.mapEmbedUrl ?? "",
          directions: showroom.directions ?? "",
          phone: showroom.phone,
          whatsapp: showroom.whatsapp ?? "",
          email: showroom.email ?? "",
          managerName: showroom.managerName ?? "",
          managerPhone: showroom.managerPhone ?? "",
          hoursWeekdays: showroom.hoursWeekdays,
          hoursSunday: showroom.hoursSunday,
          heroImage: showroom.heroImage ?? "",
          gallery: (showroom.gallery as string[]) ?? [],
          video: showroom.video ?? "",
          description: showroom.description ?? "",
          brands: (showroom.brands as string[]) ?? [],
          amenities: (showroom.amenities as string[]) ?? [],
          featuredProductIds: (showroom.featuredProductIds as string[]) ?? [],
          isFlagship: showroom.isFlagship,
          published: showroom.published,
          sortOrder: showroom.sortOrder,
          googlePlaceId: showroom.googlePlaceId ?? "",
          googleReviewUrl: showroom.googleReviewUrl ?? "",
          googleWriteReviewUrl: showroom.googleWriteReviewUrl ?? "",
          googleRating: showroom.googleRating ?? undefined,
          googleReviewCount: showroom.googleReviewCount,
          googlePhotos: (showroom.googlePhotos as string[]) ?? [],
        }
      : empty
  );
  const [slugTouched, setSlugTouched] = useState(!!showroom);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState<{ id: string; name: string; collection: string | null }[]>([]);

  useEffect(() => {
    getShowroomProductOptions().then(setProducts);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = showroomSchema.safeParse(values);
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
      if (showroom) {
        await updateShowroom(showroom.id, parsed.data);
        toast.success("Showroom updated");
      } else {
        await createShowroom(parsed.data);
        toast.success("Showroom created");
      }
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  function toggleProduct(id: string) {
    setValues((v) => ({
      ...v,
      featuredProductIds: v.featuredProductIds.includes(id)
        ? v.featuredProductIds.filter((x) => x !== id)
        : [...v.featuredProductIds, id],
    }));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="space-y-5">
        <p className="text-eyebrow text-gold">Identity</p>
        <div className="grid grid-cols-2 gap-4">
          <AField
            label="Showroom Name" required
            value={values.name}
            onChange={(e) => {
              const name = e.target.value;
              setValues((v) => ({ ...v, name, slug: slugTouched ? v.slug : slugify(name) }));
            }}
            error={errors.name}
          />
          <AField
            label="Slug" required
            value={values.slug}
            onChange={(e) => { setSlugTouched(true); setValues((v) => ({ ...v, slug: e.target.value })); }}
            error={errors.slug}
            hint="URL: /showrooms/your-slug"
          />
        </div>
        <AField
          label="Subtitle"
          value={values.subtitle}
          onChange={(e) => setValues((v) => ({ ...v, subtitle: e.target.value }))}
          placeholder="e.g. Jaquar Authorized Dealer"
        />
        <ATextArea
          label="Description"
          value={values.description}
          onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
        />
      </section>

      <section className="space-y-5 border-t border-white/8 pt-6">
        <p className="text-eyebrow text-gold">Location</p>
        <AField
          label="Address" required
          value={values.addressLine}
          onChange={(e) => setValues((v) => ({ ...v, addressLine: e.target.value }))}
          error={errors.addressLine}
          placeholder="National Highway Road, Near Indian Conventional Hall"
        />
        <div className="grid grid-cols-3 gap-4">
          <AField label="Locality" value={values.locality} onChange={(e) => setValues((v) => ({ ...v, locality: e.target.value }))} />
          <AField label="City" required value={values.city} onChange={(e) => setValues((v) => ({ ...v, city: e.target.value }))} error={errors.city} />
          <AField label="Pincode" value={values.postalCode} onChange={(e) => setValues((v) => ({ ...v, postalCode: e.target.value }))} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <AField
            label="Latitude" type="number" step="any"
            value={values.latitude ?? ""}
            onChange={(e) => setValues((v) => ({ ...v, latitude: e.target.value === "" ? null : Number(e.target.value) }))}
            hint="Used to rank nearest showroom"
          />
          <AField
            label="Longitude" type="number" step="any"
            value={values.longitude ?? ""}
            onChange={(e) => setValues((v) => ({ ...v, longitude: e.target.value === "" ? null : Number(e.target.value) }))}
          />
        </div>
        <AField
          label="Google Maps URL"
          value={values.mapUrl}
          onChange={(e) => setValues((v) => ({ ...v, mapUrl: e.target.value }))}
          hint="Paste the Maps 'Share → Copy link' URL for exact pin accuracy"
        />
        <AField
          label="Map Embed URL"
          value={values.mapEmbedUrl}
          onChange={(e) => setValues((v) => ({ ...v, mapEmbedUrl: e.target.value }))}
          hint="Optional — the src from Maps 'Share → Embed a map'"
        />
        <ATextArea
          label="Directions & Parking"
          value={values.directions}
          onChange={(e) => setValues((v) => ({ ...v, directions: e.target.value }))}
          placeholder="Landmarks, parking guidance…"
        />
      </section>

      <section className="space-y-5 border-t border-white/8 pt-6">
        <p className="text-eyebrow text-gold">Contact</p>
        <div className="grid grid-cols-2 gap-4">
          <AField label="Phone" required value={values.phone} onChange={(e) => setValues((v) => ({ ...v, phone: e.target.value }))} error={errors.phone} />
          <AField label="WhatsApp" value={values.whatsapp} onChange={(e) => setValues((v) => ({ ...v, whatsapp: e.target.value }))} hint="With country code, e.g. 919008919195" />
        </div>
        <AField label="Email" type="email" value={values.email} onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))} error={errors.email} />
        <div className="grid grid-cols-2 gap-4">
          <AField label="Manager Name" value={values.managerName} onChange={(e) => setValues((v) => ({ ...v, managerName: e.target.value }))} />
          <AField label="Manager Phone" value={values.managerPhone} onChange={(e) => setValues((v) => ({ ...v, managerPhone: e.target.value }))} />
        </div>
      </section>

      <section className="space-y-5 border-t border-white/8 pt-6">
        <p className="text-eyebrow text-gold">Business Hours</p>
        <AField label="Weekdays" value={values.hoursWeekdays} onChange={(e) => setValues((v) => ({ ...v, hoursWeekdays: e.target.value }))} />
        <AField
          label="Sunday"
          value={values.hoursSunday}
          onChange={(e) => setValues((v) => ({ ...v, hoursSunday: e.target.value }))}
          hint='Write "Sunday: Closed" when shut — the SEO schema reads this'
        />
      </section>

      <section className="space-y-5 border-t border-white/8 pt-6">
        <p className="text-eyebrow text-gold">Media</p>
        <ImageUploadField
          label="Hero Image"
          value={values.heroImage || null}
          onChange={(url) => setValues((v) => ({ ...v, heroImage: url ?? "" }))}
        />
        <MultiImageField label="Gallery" value={values.gallery} onChange={(gallery) => setValues((v) => ({ ...v, gallery }))} />
        <VideoUploadField label="Hero Video" value={values.video || null} onChange={(url) => setValues((v) => ({ ...v, video: url ?? "" }))} />
      </section>

      <section className="space-y-5 border-t border-white/8 pt-6">
        <p className="text-eyebrow text-gold">Offering</p>
        <ATagInput label="Brands Available" value={values.brands} onChange={(brands) => setValues((v) => ({ ...v, brands }))} placeholder="Jaquar, Kohler, Grohe" />
        <ATagInput label="Amenities" value={values.amenities} onChange={(amenities) => setValues((v) => ({ ...v, amenities }))} placeholder="Customer Parking, Design Consultation" />
        <div>
          <span className="mb-1.5 block text-sm font-medium text-white/70">Featured Products</span>
          <div className="max-h-44 space-y-1 overflow-y-auto rounded-xl border border-white/10 bg-white/5 p-2">
            {products.length === 0 && <p className="p-2 text-xs text-white/30">No published products yet.</p>}
            {products.map((p) => (
              <label key={p.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-white/70 hover:bg-white/5">
                <input
                  type="checkbox"
                  checked={values.featuredProductIds.includes(p.id)}
                  onChange={() => toggleProduct(p.id)}
                  className="accent-gold"
                />
                <span>{p.name}{p.collection && <span className="text-white/30"> · {p.collection}</span>}</span>
              </label>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-3 border-t border-white/8 pt-6">
        <p className="text-eyebrow text-gold">Google Business Profile</p>
        <p className="text-xs text-white/35">
          Entered by hand. Google&apos;s Business Profile API needs per-user OAuth, verified
          ownership of the location and an approved quota project — the existing service account is
          Calendar-only and can&apos;t be reused. The rating and review count below feed
          AggregateRating schema, so keep them honest and current.
        </p>
        <AField label="Google Place ID" value={values.googlePlaceId ?? ""} onChange={(e) => setValues((v) => ({ ...v, googlePlaceId: e.target.value }))} />
        <AField label="Read reviews URL" value={values.googleReviewUrl ?? ""} onChange={(e) => setValues((v) => ({ ...v, googleReviewUrl: e.target.value }))} />
        <AField label="Write a review URL" value={values.googleWriteReviewUrl ?? ""} hint="Deep link that opens the review composer" onChange={(e) => setValues((v) => ({ ...v, googleWriteReviewUrl: e.target.value }))} />
        <div className="grid gap-3 sm:grid-cols-2">
          <AField label="Rating" type="number" step="0.1" value={values.googleRating ?? ""} onChange={(e) => setValues((v) => ({ ...v, googleRating: e.target.value === "" ? undefined : Number(e.target.value) }))} />
          <AField label="Review count" type="number" value={values.googleReviewCount} onChange={(e) => setValues((v) => ({ ...v, googleReviewCount: Number(e.target.value) }))} />
        </div>
        <MultiImageField label="Google photos" value={values.googlePhotos} onChange={(googlePhotos) => setValues((v) => ({ ...v, googlePhotos }))} />
      </section>

      <section className="space-y-3 border-t border-white/8 pt-6">
        <AField label="Sort Order" type="number" value={values.sortOrder} onChange={(e) => setValues((v) => ({ ...v, sortOrder: Number(e.target.value) }))} />
        <AToggle label="Flagship Showroom" checked={values.isFlagship} onChange={(isFlagship) => setValues((v) => ({ ...v, isFlagship }))} hint="Highlighted first across the site" />
        <AToggle label="Published" checked={values.published} onChange={(published) => setValues((v) => ({ ...v, published }))} />
      </section>

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-xl bg-gold py-3 text-sm font-semibold text-ivory transition-colors hover:bg-gold-deep disabled:opacity-60"
      >
        {saving ? "Saving…" : showroom ? "Save Changes" : "Create Showroom"}
      </button>
    </form>
  );
}
