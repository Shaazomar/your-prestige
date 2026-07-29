"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Wand2 } from "lucide-react";
import { Drawer } from "@/components/admin/Drawer";
import { AField, ATagInput } from "@/components/admin/FormField";
import { composeBlogDraft, getComposerProductOptions } from "./actions";

/**
 * Builds the structural half of a post so a writer starts from an outline
 * rather than a blank page.
 *
 * The copy in this drawer is explicit that it produces a skeleton, not
 * finished writing — overselling it would lead someone to publish a draft full
 * of "TO WRITE" prompts, which is worse than no feature at all.
 */
export function ComposeDrawer({
  open,
  onClose,
  onComposed,
}: {
  open: boolean;
  onClose: () => void;
  onComposed: () => void;
}) {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [angle, setAngle] = useState("");
  const [city, setCity] = useState("Mangaluru");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [products, setProducts] = useState<{ slug: string; name: string; collection: string | null }[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    getComposerProductOptions().then(setProducts).catch(() => {});
  }, [open]);

  async function handleCompose() {
    if (!topic.trim()) {
      toast.error("Give the draft a topic");
      return;
    }
    setBusy(true);
    try {
      const result = await composeBlogDraft({
        topic,
        angle: angle || undefined,
        keywords,
        productSlugs: selected,
        city,
      });
      toast.success(`Draft created — ${result.sections} sections to write`, {
        description: "Saved unpublished. Fill in each section before publishing.",
      });
      setTopic("");
      setAngle("");
      setKeywords([]);
      setSelected([]);
      onComposed();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create the draft");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Drawer
      open={open}
      title="Compose a draft"
      description="Builds the outline, SEO fields, internal links and product references. You write the prose."
      onClose={onClose}
      wide
    >
      <div className="space-y-5">
        <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4 text-xs leading-relaxed text-white/45">
          This assembles structure, not sentences. Each section arrives with a note describing what
          to cover, and the post is saved <strong className="text-white/70">unpublished</strong> —
          a draft still full of prompts would be thin content, which hurts the site rather than
          helping it.
        </div>

        <AField
          label="Topic"
          required
          value={topic}
          placeholder="Choosing bathroom floor tiles"
          onChange={(e) => setTopic(e.target.value)}
        />
        <AField
          label="Angle"
          value={angle}
          placeholder="what actually matters in a coastal climate"
          hint="Optional. Becomes the second half of the title."
          onChange={(e) => setAngle(e.target.value)}
        />
        <AField label="City" value={city} onChange={(e) => setCity(e.target.value)} />
        <ATagInput
          label="Target keywords"
          value={keywords}
          onChange={setKeywords}
          hint="Comma separated. Seeds the SEO fields and tags."
        />

        <div>
          <p className="mb-2 text-sm text-white/60">Reference products</p>
          <p className="mb-3 text-xs text-white/35">
            Selected products are linked from the draft, which is how catalogue pages pick up
            internal links.
          </p>
          <div className="max-h-56 space-y-1 overflow-y-auto rounded-xl border border-white/8 p-2">
            {products.length === 0 ? (
              <p className="py-6 text-center text-xs text-white/25">No published products yet.</p>
            ) : (
              products.map((p) => (
                <label
                  key={p.slug}
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-white/5"
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(p.slug)}
                    onChange={(e) =>
                      setSelected((s) =>
                        e.target.checked ? [...s, p.slug] : s.filter((x) => x !== p.slug)
                      )
                    }
                    className="accent-[#b3915a]"
                  />
                  <span className="truncate">{p.name}</span>
                  {p.collection && (
                    <span className="truncate text-xs text-white/30">· {p.collection}</span>
                  )}
                </label>
              ))
            )}
          </div>
        </div>

        <div className="flex gap-3 border-t border-white/8 pt-6">
          <button
            type="button"
            onClick={handleCompose}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-lg bg-gold px-5 py-2.5 text-sm font-medium text-ink hover:bg-gold-deep disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
            {busy ? "Building…" : "Create draft"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/15 px-5 py-2.5 text-sm hover:border-white/30"
          >
            Cancel
          </button>
        </div>
      </div>
    </Drawer>
  );
}
