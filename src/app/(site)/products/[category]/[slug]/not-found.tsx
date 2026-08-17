import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Compass, ArrowRight } from "lucide-react";

export default function ProductNotFound() {
  return (
    <div className="min-h-[75vh] bg-canvas text-text flex items-center py-24">
      <Container size="narrow" className="text-center space-y-6">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-secondary border border-line/60 shadow-soft">
          <Compass className="h-10 w-10 text-gold" />
        </div>

        <div>
          <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-gold block mb-2">
            SURFACE UNAVAILABLE
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-light text-text">
            PRODUCT NOT FOUND
          </h1>
          <p className="mt-4 text-sm sm:text-base text-muted max-w-md mx-auto leading-relaxed">
            The surface you&apos;re looking for may have moved, is currently out of catalog production, or is no longer available.
          </p>
        </div>

        <div className="pt-4">
          <Link
            href="/products"
            className="inline-flex items-center gap-3 rounded-2xl bg-text px-8 py-4 text-xs font-bold uppercase tracking-wider text-white hover:bg-gold hover:text-black transition-all shadow-lift"
          >
            <span>Explore Collection</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </Container>
    </div>
  );
}
