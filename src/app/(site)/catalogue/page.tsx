"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/site/PageHero";
import { Download } from "lucide-react";
import { toast } from "sonner";


const catalogues = [
  {
    id: "master-lookbook",
    title: "2026 Master Architectural Lookbook",
    subtitle: "Complete Surface & Slab Collection",
    size: "48 MB • PDF",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200&auto=format&fit=crop",
    pages: "128 Pages",
  },
  {
    id: "sanitary-wellness",
    title: "Sanctuary Bath & Wellness Catalogue",
    subtitle: "Designer Sanitaryware & Brassware",
    size: "24 MB • PDF",
    image: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?q=80&w=1200&auto=format&fit=crop",
    pages: "64 Pages",
  },
  {
    id: "outdoor-pavers",
    title: "Exterra 20mm Heavy Duty Pavers",
    subtitle: "Pool Decks, Driveways & Commercial Plazas",
    size: "18 MB • PDF",
    image: "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?q=80&w=1200&auto=format&fit=crop",
    pages: "42 Pages",
  },
];

export default function CataloguePage() {
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownload = (title: string, id: string) => {
    setDownloading(id);
    setTimeout(() => {
      setDownloading(null);
      toast.success(`Download started for ${title}`);
      // In production, triggers direct PDF stream download
    }, 1200);
  };

  return (
    <main className="min-h-screen bg-white">
      <PageHero
        eyebrow="Digital Resource Library"
        title="Download Product Catalogues"
        description="Access high-resolution architectural lookbooks, technical spec sheets, and installation packing standards."
      />

      <section className="py-20 md:py-28">
        <Container size="wide">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {catalogues.map((cat) => (
              <div
                key={cat.id}
                className="group rounded-2xl bg-white border border-stone-200 overflow-hidden shadow-soft hover:shadow-float hover:border-accent transition-all duration-300 flex flex-col justify-between"
              >
                <div className="relative h-72 w-full overflow-hidden bg-stone-100">
                  <Image
                    src={cat.image}
                    alt={cat.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute top-4 left-4 flex gap-2">
                    <span className="rounded-full bg-black/70 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-accent backdrop-blur-md border border-white/10">
                      {cat.pages}
                    </span>
                    <span className="rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-ink backdrop-blur-md">
                      {cat.size}
                    </span>
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-ink mb-1 group-hover:text-ink">
                      {cat.title}
                    </h3>
                    <p className="text-xs text-slate-warm mb-6">{cat.subtitle}</p>
                  </div>

                  <button
                    onClick={() => handleDownload(cat.title, cat.id)}
                    disabled={downloading === cat.id}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-ink px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-accent hover:text-ink transition-colors shadow-soft disabled:opacity-50"
                  >
                    {downloading === cat.id ? "Preparing PDF..." : "Download High-Res PDF"}{" "}
                    <Download className="h-4 w-4 text-accent group-hover:text-ink" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Hardcopy Catalogue Request */}
      <section className="py-16 bg-offwhite border-t border-stone-200">
        <Container size="wide" className="text-center max-w-xl mx-auto space-y-4">
          <span className="text-eyebrow text-accent font-bold block">Architect Service</span>
          <h2 className="text-heading text-ink">Request Printed Physical Swatches</h2>
          <p className="text-body-lg text-slate-warm">
            Architects and interior designers can request a physical sample box delivered directly to their studio desk.
          </p>
          <div className="pt-2">
            <Link
              href="/request-quote"
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-8 py-3.5 text-xs font-bold uppercase tracking-wider text-ink hover:bg-accent-hover transition-colors shadow-yellow"
            >
              Request Sample Swatch Box
            </Link>
          </div>
        </Container>
      </section>
    </main>
  );
}
