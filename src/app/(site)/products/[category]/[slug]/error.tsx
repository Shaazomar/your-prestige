"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";

export default function ProductError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Product Detail Error:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] bg-canvas text-text flex items-center py-24">
      <Container size="narrow" className="text-center space-y-6">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
          <AlertTriangle className="h-8 w-8" />
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold block mb-2">
            UNABLE TO LOAD SURFACE
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-light text-text">
            Something went wrong while loading this product
          </h1>
          <p className="mt-3 text-sm text-muted max-w-md mx-auto">
            We encountered a temporary issue fetching details for this tile. Please try refreshing or return to the collection.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center gap-2 rounded-xl bg-text px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-gold hover:text-black transition-colors shadow-sm"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Try Again</span>
          </button>

          <Link
            href="/products"
            className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-text hover:border-text/30 hover:bg-secondary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Explore Collection</span>
          </Link>
        </div>
      </Container>
    </div>
  );
}
