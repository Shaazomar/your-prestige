"use client";

import Image from "next/image";
import Link from "next/link";
import { PageHero } from "@/components/site/PageHero";
import { Container } from "@/components/ui/Container";
import { useCompare } from "@/hooks/useCompare";
import { products, CatalogProduct } from "@/lib/catalog";
import { X, Trash2, ArrowRight, Plus } from "lucide-react";

export default function ProductComparisonPage() {
  const { items, remove, clear } = useCompare();

  const selectedProducts = items
    .map((slug) => products.find((p) => p.slug === slug))
    .filter(Boolean) as CatalogProduct[];

  return (
    <main className="min-h-screen bg-white">
      <PageHero
        eyebrow="Architectural Matrix"
        title="Side-by-Side Tile Comparison"
        description="Compare specifications, slab thickness, water absorption, surface texture, and application suitability across your shortlisted tiles."
      />

      <section className="py-16 md:py-24">
        <Container size="wide">
          {selectedProducts.length === 0 ? (
            <div className="py-20 text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-offwhite text-stone-300">
                <Plus className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-bold text-ink">No items selected for comparison</h3>
              <p className="text-sm text-slate-warm max-w-sm mx-auto">
                Browse our catalogue and click the &quot;Compare&quot; checkbox on any tile card to compare up to 4 products side-by-side.
              </p>

              <Link
                href="/products"
                className="inline-flex items-center gap-2 rounded-xl bg-ink px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-accent hover:text-ink transition-colors shadow-soft"
              >
                Browse Catalog <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-warm">
                  Comparing {selectedProducts.length} of 4 Products
                </span>
                <button
                  onClick={clear}
                  className="text-xs font-semibold text-stone-400 hover:text-red-600 transition-colors flex items-center gap-1"
                >
                  <Trash2 className="h-4 w-4" /> Clear All
                </button>
              </div>

              {/* Comparison Table */}
              <div className="overflow-x-auto rounded-2xl border border-stone-200 shadow-soft">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-stone-200 bg-offwhite">
                      <th className="p-4 w-56 text-xs font-bold uppercase text-slate-warm">
                        Product Specs
                      </th>
                      {selectedProducts.map((p) => (
                        <th key={p.slug} className="p-4 min-w-[240px] relative">
                          <button
                            onClick={() => remove(p.slug)}
                            className="absolute top-2 right-2 p-1 text-stone-400 hover:text-red-600 transition-colors"
                            aria-label={`Remove ${p.name}`}
                          >
                            <X className="h-4 w-4" />
                          </button>
                          <div className="relative h-40 w-full rounded-xl overflow-hidden mb-3 bg-stone-100">
                            <Image src={p.lifestyleImage} alt={p.name} fill className="object-cover" />
                          </div>
                          <span className="text-[10px] font-bold text-accent uppercase tracking-wider">
                            {p.brand}
                          </span>
                          <h4 className="text-base font-bold text-ink truncate">{p.name}</h4>
                          <p className="text-xs text-slate-warm truncate">{p.collection}</p>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200 text-sm">
                    <tr>
                      <td className="p-4 font-bold text-ink bg-offwhite/50">Category</td>
                      {selectedProducts.map((p) => (
                        <td key={p.slug} className="p-4 uppercase font-semibold text-slate-warm">
                          {p.category}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-4 font-bold text-ink bg-offwhite/50">Surface Finish</td>
                      {selectedProducts.map((p) => (
                        <td key={p.slug} className="p-4 font-medium text-ink">
                          {p.finish}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-4 font-bold text-ink bg-offwhite/50">Slab Thickness</td>
                      {selectedProducts.map((p) => (
                        <td key={p.slug} className="p-4 font-semibold text-accent">
                          {p.thickness}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-4 font-bold text-ink bg-offwhite/50">Available Sizes</td>
                      {selectedProducts.map((p) => (
                        <td key={p.slug} className="p-4 text-xs">
                          {p.sizes.map((s) => (
                            <span key={s} className="block font-medium text-ink">
                              {s}
                            </span>
                          ))}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-4 font-bold text-ink bg-offwhite/50">Base Color / Tone</td>
                      {selectedProducts.map((p) => (
                        <td key={p.slug} className="p-4 font-medium text-slate-warm">
                          {p.color}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-4 font-bold text-ink bg-offwhite/50">Texture Pattern</td>
                      {selectedProducts.map((p) => (
                        <td key={p.slug} className="p-4 text-xs text-slate-warm">
                          {p.texture}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-4 font-bold text-ink bg-offwhite/50">Applications</td>
                      {selectedProducts.map((p) => (
                        <td key={p.slug} className="p-4 text-xs">
                          <div className="flex flex-wrap gap-1">
                            {p.applications.map((app) => (
                              <span
                                key={app}
                                className="rounded bg-offwhite px-2 py-0.5 text-[10px] font-semibold text-ink border border-stone-200"
                              >
                                {app}
                              </span>
                            ))}
                          </div>
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-4 font-bold text-ink bg-offwhite/50">Actions</td>
                      {selectedProducts.map((p) => (
                        <td key={p.slug} className="p-4">
                          <Link
                            href={`/products/${p.category}/${p.slug}`}
                            className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-ink hover:text-accent transition-colors"
                          >
                            View Details <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Container>
      </section>
    </main>
  );
}
