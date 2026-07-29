"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { AField, ATextArea, ASelect, AToggle, ATagInput } from "@/components/admin/FormField";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { MultiImageField } from "@/components/admin/MultiImageField";
import {
  createLandingPage, updateLandingPage, getLandingPageOptions, type LandingPageRow,
} from "./actions";
import { landingPageSchema, type LandingPageInput } from "./schema";

const empty: LandingPageInput = {
  slug: "", kind: "local", title: "", heading: "", subheading: "", intro: "",
  blocks: [], city: "", locality: "", areaServed: [], serviceType: "",
  heroImage: "", gallery: [], faqs: [], showroomIds: [], featuredProductIds: [],
  published: true, sortOrder: 0,
};

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

export function LandingPageForm({
  page,
  onSuccess,
}: {
  page: LandingPageRow | null;
  onSuccess: () => void;
}) {
  const [values, setValues] = useState<LandingPageInput>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);
  const [options, setOptions] = useState<{
    showrooms: { id: string; name: string; city: string }[];
    brands: { id: string; name: string }[];
  }>({ showrooms: [], brands: [] });

  useEffect(() => {
    getLandingPageOptions().then(setOptions).catch(() => {});
  }, []);

  useEffect(() => {
    if (!page) {
      setValues(empty);
      setSlugTouched(false);
    } else {
      setValues({
        slug: page.slug,
        kind: (page.kind as LandingPageInput["kind"]) ?? "local",
        title: page.title,
        heading: page.heading,
        subheading: page.subheading ?? "",
        intro: page.intro ?? "",
        blocks: arr(page.blocks),
        city: page.city ?? "",
        locality: page.locality ?? "",
        areaServed: arr<string>(page.areaServed),
        serviceType: page.serviceType ?? "",
        heroImage: page.heroImage ?? "",
        gallery: arr<string>(page.gallery),
        faqs: arr(page.faqs),
        showroomIds: arr<string>(page.showroomIds),
        featuredProductIds: arr<string>(page.featuredProductIds),
        published: page.published,
        sortOrder: page.sortOrder,
      });
      setSlugTouched(true);
    }
    setErrors({});
  }, [page]);

  const set = <K extends keyof LandingPageInput>(k: K, v: LandingPageInput[K]) =>
    setValues((s) => ({ ...s, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = landingPageSchema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) fieldErrors[issue.path[0] as string] = issue.message;
      setErrors(fieldErrors);
      toast.error("Please fix the highlighted fields");
      return;
    }
    setSaving(true);
    try {
      if (page) await updateLandingPage(page.id, parsed.data);
      else await createLandingPage(parsed.data);
      toast.success(page ? "Landing page saved" : "Landing page created");
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <AField
        label="Page title (browser tab & search result)"
        required
        value={values.title}
        error={errors.title}
        onChange={(e) => {
          set("title", e.target.value);
          if (!slugTouched) set("slug", slugify(e.target.value.split("—")[0]));
        }}
      />
      <AField
        label="URL slug"
        required
        value={values.slug}
        error={errors.slug}
        hint={`Served at /${values.slug || "…"}`}
        onChange={(e) => {
          setSlugTouched(true);
          set("slug", e.target.value);
        }}
      />
      <AField label="Heading (H1 on the page)" required value={values.heading} error={errors.heading} onChange={(e) => set("heading", e.target.value)} />
      <AField label="Subheading" value={values.subheading ?? ""} onChange={(e) => set("subheading", e.target.value)} />
      <ATextArea
        label="Introduction"
        value={values.intro ?? ""}
        rows={5}
        hint="Write something specific to this location or product type. Pages that differ only by place name are treated as doorway pages and demoted."
        onChange={(e) => set("intro", e.target.value)}
      />

      <section className="space-y-5 border-t border-white/8 pt-6">
        <p className="text-eyebrow text-gold">Targeting</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <ASelect label="Kind" value={values.kind} onChange={(e) => set("kind", e.target.value as LandingPageInput["kind"])}>
            <option value="local">Local (town or area)</option>
            <option value="brand">Brand</option>
            <option value="collection">Collection</option>
          </ASelect>
          <AField label="Service type" value={values.serviceType ?? ""} hint="e.g. Bathroom Tiles, Jaquar" onChange={(e) => set("serviceType", e.target.value)} />
          <AField label="City" value={values.city ?? ""} onChange={(e) => set("city", e.target.value)} />
          <AField label="Locality" value={values.locality ?? ""} onChange={(e) => set("locality", e.target.value)} />
        </div>
        <ATagInput
          label="Areas served"
          value={values.areaServed}
          onChange={(v) => set("areaServed", v)}
          hint="Feeds the areaServed property in this page's Service schema"
        />
        <div>
          <p className="mb-2 text-sm text-white/60">Showrooms serving this page</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {options.showrooms.map((s) => (
              <label key={s.id} className="flex items-center gap-2 rounded-lg border border-white/8 px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  checked={values.showroomIds.includes(s.id)}
                  onChange={(e) =>
                    set(
                      "showroomIds",
                      e.target.checked
                        ? [...values.showroomIds, s.id]
                        : values.showroomIds.filter((x) => x !== s.id)
                    )
                  }
                  className="accent-[#b3915a]"
                />
                <span className="truncate">{s.name}</span>
              </label>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-5 border-t border-white/8 pt-6">
        <div className="flex items-center justify-between">
          <p className="text-eyebrow text-gold">Content blocks</p>
          <button
            type="button"
            onClick={() => set("blocks", [...values.blocks, { heading: "", body: "" }])}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs hover:border-gold/40"
          >
            <Plus className="h-3.5 w-3.5" /> Add block
          </button>
        </div>
        {values.blocks.map((b, i) => (
          <div key={i} className="space-y-3 rounded-xl border border-white/8 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/35">Block {i + 1}</span>
              <button
                type="button"
                onClick={() => set("blocks", values.blocks.filter((_, j) => j !== i))}
                className="text-white/30 hover:text-red-300"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <AField
              label="Heading"
              value={b.heading ?? ""}
              onChange={(e) =>
                set("blocks", values.blocks.map((x, j) => (j === i ? { ...x, heading: e.target.value } : x)))
              }
            />
            <ATextArea
              label="Body"
              rows={4}
              value={b.body ?? ""}
              onChange={(e) =>
                set("blocks", values.blocks.map((x, j) => (j === i ? { ...x, body: e.target.value } : x)))
              }
            />
          </div>
        ))}
      </section>

      <section className="space-y-5 border-t border-white/8 pt-6">
        <div className="flex items-center justify-between">
          <p className="text-eyebrow text-gold">FAQs</p>
          <button
            type="button"
            onClick={() => set("faqs", [...values.faqs, { q: "", a: "" }])}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs hover:border-gold/40"
          >
            <Plus className="h-3.5 w-3.5" /> Add question
          </button>
        </div>
        <p className="text-xs text-white/35">
          Rendered on the page and emitted as FAQPage schema. Only add questions the page actually answers.
        </p>
        {values.faqs.map((f, i) => (
          <div key={i} className="space-y-3 rounded-xl border border-white/8 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/35">Question {i + 1}</span>
              <button
                type="button"
                onClick={() => set("faqs", values.faqs.filter((_, j) => j !== i))}
                className="text-white/30 hover:text-red-300"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <AField
              label="Question"
              value={f.q}
              onChange={(e) => set("faqs", values.faqs.map((x, j) => (j === i ? { ...x, q: e.target.value } : x)))}
            />
            <ATextArea
              label="Answer"
              rows={3}
              value={f.a}
              onChange={(e) => set("faqs", values.faqs.map((x, j) => (j === i ? { ...x, a: e.target.value } : x)))}
            />
          </div>
        ))}
      </section>

      <section className="space-y-5 border-t border-white/8 pt-6">
        <p className="text-eyebrow text-gold">Media &amp; publishing</p>
        <ImageUploadField label="Hero image" value={values.heroImage || null} onChange={(url) => set("heroImage", url ?? "")} />
        <MultiImageField label="Gallery" value={values.gallery} onChange={(v) => set("gallery", v)} />
        <div className="grid gap-4 sm:grid-cols-2">
          <AField
            label="Sort order"
            type="number"
            value={String(values.sortOrder)}
            onChange={(e) => set("sortOrder", Number(e.target.value) as LandingPageInput["sortOrder"])}
          />
        </div>
        <AToggle label="Published" checked={values.published} onChange={(v) => set("published", v)} />
      </section>

      <div className="flex gap-3 border-t border-white/8 pt-6">
        <button type="submit" disabled={saving} className="rounded-lg bg-gold px-5 py-2.5 text-sm font-medium text-ink hover:bg-gold-deep disabled:opacity-60">
          {saving ? "Saving…" : page ? "Save Changes" : "Create Landing Page"}
        </button>
      </div>
    </form>
  );
}
