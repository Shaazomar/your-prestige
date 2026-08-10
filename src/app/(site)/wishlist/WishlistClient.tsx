"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { Trash2, ArrowUpRight, Loader2 } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";
import { useLocalCollection, WISHLIST_KEY } from "@/hooks/useLocalCollection";
import type { CatalogProduct } from "@/lib/catalog";
import { business } from "@/lib/site-config";
import { waHref } from "@/lib/business";

/**
 * The visitor's saved selection.
 *
 * The list itself is device-local, so the useful action here isn't "sync your
 * account" — it's turning the selection into a real enquiry. Requesting a
 * quote posts the saved products alongside the contact details, which creates
 * a Lead the showroom team can actually act on. That's the persistence that
 * matters commercially.
 */
export function WishlistClient() {
  const wishlist = useLocalCollection(WISHLIST_KEY, 60);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", message: "" });

  const key = wishlist.items.join(",");

  useEffect(() => {
    if (!wishlist.ready) return;
    if (!key) {
      setProducts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/api/products/by-slug?slugs=${encodeURIComponent(key)}`)
      .then((r) => (r.ok ? r.json() : { products: [] }))
      .then((d) => setProducts(d.products ?? []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [key, wishlist.ready]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      toast.error("Please add your name and phone number");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          type: "QUOTE",
          source: "wishlist",
          message:
            `${form.message}\n\nSaved selection (${products.length}):\n` +
            products.map((p) => `• ${p.name} — ${p.brand}${p.sizes.length ? ` (${p.sizes.join(", ")})` : ""}`).join("\n"),
        }),
      });
      if (!res.ok) throw new Error("Could not send your request");
      toast.success("Details saved! Directing you to WhatsApp to place your order...");
      
      const message = `Hi! I would like to order/enquire about these items from my wishlist:\n` +
        products.map((p, i) => `${i + 1}. ${p.name} (SKU: ${p.sku || "N/A"})`).join("\n") +
        (form.message ? `\n\nNotes: ${form.message}` : "");
      
      window.open(waHref(business.whatsapp, message), "_blank");
      
      setForm({ name: "", phone: "", message: "" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSending(false);
    }
  }

  if (!wishlist.ready || loading) {
    return (
      <Container className="flex justify-center py-32">
        <Loader2 className="h-5 w-5 animate-spin text-gold" />
      </Container>
    );
  }

  if (products.length === 0) {
    return (
      <Container className="py-24 text-center">
        <p className="text-lg text-ink/50">You haven&apos;t saved anything yet.</p>
        <p className="mt-2 text-sm text-ink/35">
          Tap the heart on any piece to keep it here while you plan.
        </p>
        <ButtonLink href="/products" className="mt-8">Browse the catalogue</ButtonLink>
      </Container>
    );
  }

  return (
    <Container className="py-16 md:py-24">
      <div className="grid gap-12 lg:grid-cols-[1fr_380px]">
        <div>
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-ink/45">
              {products.length} piece{products.length === 1 ? "" : "s"} saved
            </p>
            <button
              onClick={() => {
                wishlist.clear();
                toast.success("Selection cleared");
              }}
              className="text-xs text-ink/40 underline underline-offset-4 hover:text-ink"
            >
              Clear all
            </button>
          </div>

          <ul className="space-y-4">
            {products.map((p) => (
              <li
                key={p.slug}
                className="flex gap-4 rounded-2xl border border-ink/8 bg-white/60 p-4"
              >
                <Link
                  href={`/products/${p.category}/${p.slug}`}
                  className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-ink/5"
                >
                  <Image src={p.lifestyleImage} alt={p.name} fill sizes="96px" className="object-cover" />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/products/${p.category}/${p.slug}`}
                    className="group inline-flex items-center gap-1 font-medium"
                  >
                    {p.name}
                    <ArrowUpRight className="h-3.5 w-3.5 text-gold opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                  <p className="text-sm text-ink/40">{p.brand} · {p.collection}</p>
                  <p className="mt-1 text-xs text-ink/35">
                    {[p.finish, p.sizes.join(", ")].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <button
                  onClick={() => wishlist.remove(p.slug)}
                  aria-label={`Remove ${p.name}`}
                  className="self-start rounded-lg p-2 text-ink/30 transition-colors hover:bg-ink/5 hover:text-ink"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <form onSubmit={handleSubmit} className="rounded-3xl border border-ink/8 bg-white/70 p-6">
            <p className="text-eyebrow mb-2 text-gold">Next step</p>
            <h2 className="text-xl font-semibold tracking-tight">Order via WhatsApp</h2>
            <p className="mt-2 text-sm text-ink/45">
              Submit details to log your enquiry, then continue directly on WhatsApp to coordinate pricing and delivery.
            </p>

            <div className="mt-6 space-y-3">
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Your name"
                className="w-full rounded-xl border border-ink/10 bg-white px-4 py-3 text-sm outline-none focus:border-gold/50"
              />
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="Phone number"
                inputMode="tel"
                className="w-full rounded-xl border border-ink/10 bg-white px-4 py-3 text-sm outline-none focus:border-gold/50"
              />
              <textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Anything we should know? (area, timeline, budget)"
                rows={3}
                className="w-full resize-none rounded-xl border border-ink/10 bg-white px-4 py-3 text-sm outline-none focus:border-gold/50"
              />
              <button
                type="submit"
                disabled={sending}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink px-6 py-3.5 text-sm font-medium text-ivory transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {sending && <Loader2 className="h-4 w-4 animate-spin" />}
                {sending ? "Sending…" : `Order all on WhatsApp`}
              </button>
            </div>

            <p className="mt-4 text-[0.7rem] leading-relaxed text-ink/35">
              Your selection is saved on this device only. Sending it to us is what keeps it — and
              gets you a price.
            </p>
          </form>
        </aside>
      </div>
    </Container>
  );
}
