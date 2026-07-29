"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Check, X, Pencil, Merge, Star, EyeOff, Search, Copy, Loader2 } from "lucide-react";
import { Drawer } from "@/components/admin/Drawer";
import { AField, ATextArea, ATagInput, AToggle } from "@/components/admin/FormField";
import {
  listExtracted, updateExtracted, setExtractedStatus, mergeExtracted,
  detectDuplicates, publishApproved, type ExtractedRow,
} from "./actions";
import { extractedProductSchema, PUBLISH_CATEGORIES, type ExtractedProductInput } from "./schema";
import { EXTRACTED_STATUS_STYLES } from "./status";

/**
 * Review surface for staged products.
 *
 * Nothing here publishes automatically. Extraction is heuristic, so the design
 * assumption is that a human will correct some rows — which is why the grid
 * sorts least-confident first, shows the source page for every field, and makes
 * approve/reject a single click with bulk selection.
 */
export function ReviewGrid({
  importId,
  canEdit,
  canPublish,
}: {
  importId: string;
  canEdit: boolean;
  canPublish: boolean;
}) {
  const [rows, setRows] = useState<ExtractedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<ExtractedRow | null>(null);
  const [merging, setMerging] = useState<ExtractedRow | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [category, setCategory] = useState<(typeof PUBLISH_CATEGORIES)[number]>("tiles");
  const [publishLive, setPublishLive] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      setRows(await listExtracted(importId, { status: filter, search }));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, search, importId]);

  const counts = useMemo(() => {
    const c = { ALL: rows.length, PENDING: 0, APPROVED: 0, REJECTED: 0, PUBLISHED: 0 };
    for (const r of rows) if (r.status in c) c[r.status as keyof typeof c]++;
    return c;
  }, [rows]);

  const approvedCount = rows.filter((r) => r.status === "APPROVED" && !r.hidden && !r.productId).length;

  async function mark(ids: string[], status: "APPROVED" | "REJECTED" | "PENDING") {
    if (ids.length === 0) return;
    try {
      await setExtractedStatus(ids, status);
      toast.success(`${ids.length} product${ids.length === 1 ? "" : "s"} ${status.toLowerCase()}`);
      setSelected(new Set());
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    }
  }

  async function handleDuplicates() {
    try {
      const n = await detectDuplicates(importId);
      toast[n > 0 ? "warning" : "success"](
        n > 0 ? `${n} row${n === 1 ? "" : "s"} already exist in the catalogue` : "No duplicates found"
      );
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Check failed");
    }
  }

  async function handlePublish() {
    setPublishing(true);
    try {
      const result = await publishApproved({ importId, category, publishLive });
      toast.success(
        `Published ${result.published} product${result.published === 1 ? "" : "s"}` +
          (result.skipped ? ` — ${result.skipped} skipped` : "")
      );
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Publish failed");
    } finally {
      setPublishing(false);
    }
  }

  const toggle = (id: string) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="space-y-5">
      {/* Filters + bulk actions */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5">
          {(["ALL", "PENDING", "APPROVED", "REJECTED", "PUBLISHED"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === f ? "bg-gold text-ink" : "border border-white/10 text-white/50 hover:border-gold/30"
              }`}
            >
              {f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
              {f in counts ? ` (${counts[f as keyof typeof counts]})` : ""}
            </button>
          ))}
        </div>

        <div className="relative ml-auto">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/30" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search staged products…"
            className="w-56 rounded-lg border border-white/10 bg-[#0c0c0b] py-2 pl-9 pr-3 text-sm outline-none focus:border-gold/40"
          />
        </div>

        {canEdit && (
          <button
            onClick={handleDuplicates}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs transition-colors hover:border-gold/30"
          >
            <Copy className="h-3.5 w-3.5" /> Check duplicates
          </button>
        )}
      </div>

      {selected.size > 0 && canEdit && (
        <div className="flex items-center gap-3 rounded-xl border border-gold/20 bg-gold/5 px-4 py-3">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <button onClick={() => mark([...selected], "APPROVED")} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/20 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-500/30">
            <Check className="h-3.5 w-3.5" /> Approve
          </button>
          <button onClick={() => mark([...selected], "REJECTED")} className="inline-flex items-center gap-1.5 rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-medium text-red-300 hover:bg-red-500/30">
            <X className="h-3.5 w-3.5" /> Reject
          </button>
          <button onClick={() => setSelected(new Set())} className="ml-auto text-xs text-white/40 hover:text-white/70">
            Clear
          </button>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-gold" /></div>
      ) : rows.length === 0 ? (
        <p className="py-16 text-center text-sm text-white/30">
          No staged products{filter !== "ALL" ? ` with status ${filter.toLowerCase()}` : ""} yet.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((row) => {
            const sizes = Array.isArray(row.sizes) ? (row.sizes as string[]) : [];
            const apps = Array.isArray(row.applications) ? (row.applications as string[]) : [];
            const isSelected = selected.has(row.id);
            return (
              <div
                key={row.id}
                className={`overflow-hidden rounded-2xl border bg-[#141413] transition-colors ${
                  isSelected ? "border-gold/50" : "border-white/8 hover:border-white/15"
                }`}
              >
                <div className="relative aspect-[4/3] bg-[#0c0c0b]">
                  {row.hero?.url ? (
                    <Image src={row.hero.url} alt={row.hero.altText ?? row.name} fill className="object-cover" sizes="360px" unoptimized />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-white/25">No image matched</div>
                  )}
                  <button
                    onClick={() => toggle(row.id)}
                    aria-label={isSelected ? "Deselect" : "Select"}
                    className={`absolute left-3 top-3 flex h-6 w-6 items-center justify-center rounded-md border transition-colors ${
                      isSelected ? "border-gold bg-gold text-ink" : "border-white/30 bg-black/40 hover:border-gold"
                    }`}
                  >
                    {isSelected && <Check className="h-3.5 w-3.5" />}
                  </button>
                  <div className="absolute right-3 top-3 flex gap-1.5">
                    {row.featured && <span className="rounded-full bg-gold/90 p-1 text-ink"><Star className="h-3 w-3" /></span>}
                    {row.hidden && <span className="rounded-full bg-black/60 p-1 text-white/70"><EyeOff className="h-3 w-3" /></span>}
                  </div>
                  <span className={`absolute bottom-3 left-3 rounded-full px-2 py-0.5 text-[0.6rem] font-semibold ${EXTRACTED_STATUS_STYLES[row.status]}`}>
                    {row.status}
                  </span>
                  <span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2 py-0.5 text-[0.6rem] text-white/60">
                    p.{row.pageStart} · {Math.round(row.confidence * 100)}%
                  </span>
                </div>

                <div className="space-y-2 p-4">
                  <div>
                    <p className="truncate font-medium">{row.name}</p>
                    <p className="truncate text-xs text-white/35">
                      {[row.brandName, row.collectionName].filter(Boolean).join(" · ") || "—"}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {sizes.slice(0, 3).map((s) => (
                      <span key={s} className="rounded bg-white/5 px-1.5 py-0.5 text-[0.65rem] text-white/50">{s}</span>
                    ))}
                    {row.finish && <span className="rounded bg-white/5 px-1.5 py-0.5 text-[0.65rem] text-white/50">{row.finish}</span>}
                    {row.thickness && <span className="rounded bg-white/5 px-1.5 py-0.5 text-[0.65rem] text-white/50">{row.thickness}</span>}
                  </div>

                  {apps.length > 0 && (
                    <p className="truncate text-[0.65rem] text-white/30">{apps.join(", ")}</p>
                  )}

                  {row.duplicateOfProductId && (
                    <p className="rounded bg-amber-400/10 px-2 py-1 text-[0.65rem] text-amber-300">
                      Already in the catalogue — merge or reject
                    </p>
                  )}

                  {canEdit && row.status !== "PUBLISHED" && (
                    <div className="flex items-center gap-1.5 pt-1">
                      <button onClick={() => mark([row.id], "APPROVED")} title="Approve" className="rounded-md bg-emerald-500/15 p-1.5 text-emerald-300 hover:bg-emerald-500/25">
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => mark([row.id], "REJECTED")} title="Reject" className="rounded-md bg-red-500/15 p-1.5 text-red-300 hover:bg-red-500/25">
                        <X className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => setEditing(row)} title="Edit" className="rounded-md bg-white/5 p-1.5 text-white/60 hover:bg-white/10">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => setMerging(row)} title="Merge into another" className="rounded-md bg-white/5 p-1.5 text-white/60 hover:bg-white/10">
                        <Merge className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Publish */}
      {canPublish && approvedCount > 0 && (
        <div className="sticky bottom-4 flex flex-wrap items-center gap-4 rounded-2xl border border-gold/25 bg-[#141413] p-5 shadow-lg">
          <div>
            <p className="font-medium">{approvedCount} approved product{approvedCount === 1 ? "" : "s"} ready</p>
            <p className="text-xs text-white/40">Rejected and pending rows are never published.</p>
          </div>
          <label className="ml-auto flex items-center gap-2 text-sm">
            <span className="text-white/50">Category</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as typeof category)}
              className="rounded-lg border border-white/10 bg-[#0c0c0b] px-3 py-2 text-sm outline-none focus:border-gold/40"
            >
              {PUBLISH_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-white/60">
            <input type="checkbox" checked={publishLive} onChange={(e) => setPublishLive(e.target.checked)} className="accent-[#b3915a]" />
            Publish live immediately
          </label>
          <button
            onClick={handlePublish}
            disabled={publishing}
            className="inline-flex items-center gap-2 rounded-lg bg-gold px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-gold-deep disabled:opacity-60"
          >
            {publishing && <Loader2 className="h-4 w-4 animate-spin" />}
            {publishing ? "Publishing…" : `Publish ${approvedCount}`}
          </button>
        </div>
      )}

      <EditDrawer row={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); void refresh(); }} />
      <MergeDrawer
        row={merging}
        candidates={rows.filter((r) => r.id !== merging?.id && r.status !== "MERGED")}
        onClose={() => setMerging(null)}
        onMerged={() => { setMerging(null); void refresh(); }}
      />
    </div>
  );
}

function EditDrawer({
  row, onClose, onSaved,
}: { row: ExtractedRow | null; onClose: () => void; onSaved: () => void }) {
  const [values, setValues] = useState<ExtractedProductInput | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!row) return setValues(null);
    setValues({
      name: row.name,
      brandName: row.brandName ?? "",
      collectionName: row.collectionName ?? "",
      productCode: row.productCode ?? "",
      sizes: Array.isArray(row.sizes) ? (row.sizes as string[]) : [],
      finish: row.finish ?? "",
      thickness: row.thickness ?? "",
      material: row.material ?? "",
      color: row.color ?? "",
      surface: row.surface ?? "",
      applications: Array.isArray(row.applications) ? (row.applications as string[]) : [],
      applicationTags: Array.isArray(row.applicationTags) ? (row.applicationTags as string[]) : [],
      premiumDescription: row.premiumDescription ?? "",
      seoTitle: row.seoTitle ?? "",
      seoDescription: row.seoDescription ?? "",
      slug: row.slug ?? "",
      featured: row.featured,
      hidden: row.hidden,
      publishAsDraft: row.publishAsDraft,
      reviewNote: row.reviewNote ?? "",
    });
    setErrors({});
  }, [row]);

  const set = <K extends keyof ExtractedProductInput>(k: K, v: ExtractedProductInput[K]) =>
    setValues((s) => (s ? { ...s, [k]: v } : s));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!row || !values) return;
    const parsed = extractedProductSchema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) fieldErrors[issue.path[0] as string] = issue.message;
      setErrors(fieldErrors);
      toast.error("Please fix the highlighted fields");
      return;
    }
    setSaving(true);
    try {
      await updateExtracted(row.id, parsed.data);
      toast.success("Saved");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Drawer open={!!row} title={row?.name ?? ""} description={`Extracted from page ${row?.pageStart}`} onClose={onClose} wide>
      {values && (
        <form onSubmit={handleSubmit} className="space-y-5">
          <AField label="Name" required value={values.name} error={errors.name} onChange={(e) => set("name", e.target.value)} />
          <div className="grid gap-4 sm:grid-cols-2">
            <AField label="Brand" value={values.brandName ?? ""} onChange={(e) => set("brandName", e.target.value)} />
            <AField label="Collection" value={values.collectionName ?? ""} onChange={(e) => set("collectionName", e.target.value)} />
            <AField label="Product Code" value={values.productCode ?? ""} onChange={(e) => set("productCode", e.target.value)} />
            <AField label="Thickness" value={values.thickness ?? ""} onChange={(e) => set("thickness", e.target.value)} />
            <AField label="Finish" value={values.finish ?? ""} onChange={(e) => set("finish", e.target.value)} />
            <AField label="Surface" value={values.surface ?? ""} onChange={(e) => set("surface", e.target.value)} />
            <AField label="Material" value={values.material ?? ""} onChange={(e) => set("material", e.target.value)} />
            <AField label="Colour" value={values.color ?? ""} onChange={(e) => set("color", e.target.value)} />
          </div>
          <ATagInput label="Sizes" value={values.sizes} onChange={(v) => set("sizes", v)} hint="Comma separated, e.g. 600x1200, 800x1600" />
          <ATagInput label="Applications" value={values.applications} onChange={(v) => set("applications", v)} hint="Only recognised room types appear as icons on the site" />
          <ATagInput label="Other application tags" value={values.applicationTags} onChange={(v) => set("applicationTags", v)} hint="Kept for search — not shown as badges" />

          <section className="space-y-5 border-t border-white/8 pt-6">
            <p className="text-eyebrow text-gold">Copy &amp; SEO</p>
            <ATextArea label="Description" value={values.premiumDescription ?? ""} onChange={(e) => set("premiumDescription", e.target.value)} rows={5} />
            <AField label="SEO Title" value={values.seoTitle ?? ""} onChange={(e) => set("seoTitle", e.target.value)} hint={`${(values.seoTitle ?? "").length}/60`} />
            <ATextArea label="SEO Description" value={values.seoDescription ?? ""} onChange={(e) => set("seoDescription", e.target.value)} hint={`${(values.seoDescription ?? "").length}/155`} />
            <AField label="Slug" value={values.slug ?? ""} error={errors.slug} onChange={(e) => set("slug", e.target.value)} />
          </section>

          <section className="space-y-4 border-t border-white/8 pt-6">
            <p className="text-eyebrow text-gold">Publishing</p>
            <AToggle label="Feature this product" checked={values.featured} onChange={(v) => set("featured", v)} />
            <AToggle label="Hide from publish" checked={values.hidden} onChange={(v) => set("hidden", v)} hint="Approved but held back" />
            <AToggle label="Publish as draft" checked={values.publishAsDraft} onChange={(v) => set("publishAsDraft", v)} hint="Creates the product unpublished, whatever the batch setting" />
            <ATextArea label="Review note" value={values.reviewNote ?? ""} onChange={(e) => set("reviewNote", e.target.value)} rows={2} />
          </section>

          <div className="flex gap-3 border-t border-white/8 pt-6">
            <button type="submit" disabled={saving} className="rounded-lg bg-gold px-5 py-2.5 text-sm font-medium text-ink hover:bg-gold-deep disabled:opacity-60">
              {saving ? "Saving…" : "Save Changes"}
            </button>
            <button type="button" onClick={onClose} className="rounded-lg border border-white/15 px-5 py-2.5 text-sm hover:border-white/30">
              Cancel
            </button>
          </div>
        </form>
      )}
    </Drawer>
  );
}

function MergeDrawer({
  row, candidates, onClose, onMerged,
}: { row: ExtractedRow | null; candidates: ExtractedRow[]; onClose: () => void; onMerged: () => void }) {
  const [targetId, setTargetId] = useState("");
  useEffect(() => setTargetId(""), [row]);

  async function handleMerge() {
    if (!row || !targetId) return;
    try {
      await mergeExtracted(row.id, targetId);
      toast.success("Merged");
      onMerged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Merge failed");
    }
  }

  return (
    <Drawer
      open={!!row}
      title="Merge duplicate"
      description={`"${row?.name}" will be folded into the product you choose — its images move across, and any field the target is missing is filled in from this one.`}
      onClose={onClose}
    >
      <div className="space-y-5">
        <label className="block">
          <span className="mb-2 block text-sm text-white/60">Merge into</span>
          <select
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-[#0c0c0b] px-3 py-2.5 text-sm outline-none focus:border-gold/40"
          >
            <option value="">Choose a product…</option>
            {candidates.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}{c.productCode ? ` (${c.productCode})` : ""} — p.{c.pageStart}
              </option>
            ))}
          </select>
        </label>
        <div className="flex gap-3">
          <button onClick={handleMerge} disabled={!targetId} className="rounded-lg bg-gold px-5 py-2.5 text-sm font-medium text-ink hover:bg-gold-deep disabled:opacity-40">
            Merge
          </button>
          <button onClick={onClose} className="rounded-lg border border-white/15 px-5 py-2.5 text-sm hover:border-white/30">
            Cancel
          </button>
        </div>
      </div>
    </Drawer>
  );
}
