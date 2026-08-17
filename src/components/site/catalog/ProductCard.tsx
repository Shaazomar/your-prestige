"use client";

import Link from "next/link";
import { Layers, ArrowUpRight } from "lucide-react";
import type { CatalogProduct } from "@/lib/catalog";
import { WishlistButton } from "@/components/site/catalog/WishlistButton";
import { useCompare } from "@/hooks/useCompare";
import { cn } from "@/lib/utils";
import { SafeImage } from "@/components/ui/SafeImage";

interface ProductCardProps {
  product: CatalogProduct;
  className?: string;
  /** Only the first row of an above-the-fold grid should set this. */
  priority?: boolean;
}

/**
 * Product card — image-led, unboxed.
 *
 * The card has no border and no panel. On a warm-white ground a bordered
 * box competes with the tile it is showing; letting the image sit directly
 * on the page and hanging quiet type beneath it reads as a sample board
 * rather than a marketplace listing.
 *
 * Nothing about stock, warehouse or availability appears here, by design —
 * depot quantities are internal and never reach a public surface.
 */
export function ProductCard({ product, className, priority = false }: ProductCardProps) {
  const { has: isComparing, toggle: toggleCompare } = useCompare();

  const href = `/products/${product.category}/${product.slug}`;
  const compared = isComparing(product.slug);
  const size = product.sizes?.[0];

  /* Finish and collection often carry the same word on imported rows;
     showing it twice looks like a bug. */
  const meta = [product.collection, product.finish]
    .map((v) => v?.trim())
    .filter((v): v is string => Boolean(v) && v !== "Standard")
    .filter((v, i, a) => a.indexOf(v) === i)
    .join(" · ");

  return (
    <article className={cn("group relative flex flex-col", className)}>
      <div className="relative overflow-hidden rounded-[1.25rem] bg-stone-100">
        <Link
          href={href}
          className="block focus-visible:outline-none"
          aria-label={`${product.name} by ${product.brand}`}
        >
          <div className="relative aspect-[4/5] w-full overflow-hidden">
            <SafeImage
              src={product.lifestyleImage}
              alt={product.name}
              fill
              priority={priority}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              placeholderLabel={product.brand}
              className="object-cover object-center transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
              lightSkeleton
            />
          </div>
        </Link>

        {product.tag && (
          <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-canvas/90 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-text backdrop-blur-sm">
            {product.tag}
          </span>
        )}

        {/* Secondary actions. Hidden until hover on pointer devices so the
            grid stays calm; always visible on touch, where hover never fires. */}
        <div
          className={cn(
            // z-20 keeps these above the title link's full-card ::after overlay.
            "absolute right-3 top-3 z-20 flex items-center gap-1.5",
            "opacity-100 transition-opacity duration-300",
            "md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
          )}
        >
          <button
            type="button"
            onClick={() => toggleCompare(product.slug)}
            aria-label={compared ? `Remove ${product.name} from compare` : `Compare ${product.name}`}
            aria-pressed={compared}
            className={cn(
              "grid h-9 w-9 place-items-center rounded-full backdrop-blur-sm transition-colors duration-200",
              compared
                ? "bg-gold text-text"
                : "bg-canvas/85 text-muted hover:text-text"
            )}
          >
            <Layers className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
          <WishlistButton slug={product.slug} name={product.name} />
        </div>
      </div>

      {/* Information hangs off the image — no card, no separator box. */}
      <div className="flex flex-1 flex-col pt-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold">
          {product.brand}
        </p>

        <h3 className="mt-1.5 text-[0.9375rem] font-medium leading-snug tracking-tight text-text">
          <Link href={href} className="after:absolute after:inset-0 after:content-['']">
            {product.name}
          </Link>
        </h3>

        {size && <p className="mt-1 text-[0.8125rem] text-muted">{size}</p>}

        {meta && (
          <p className="mt-0.5 line-clamp-1 text-[0.75rem] text-faint">{meta}</p>
        )}

        <span
          aria-hidden="true"
          className="mt-3 inline-flex items-center text-muted transition-colors duration-300 group-hover:text-gold"
        >
          <ArrowUpRight className="h-4 w-4 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
      </div>
    </article>
  );
}
