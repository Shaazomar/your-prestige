"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { SafeImage } from "@/components/ui/SafeImage";
import { cn } from "@/lib/utils";
import type { BrandView } from "@/lib/brands";

/**
 * Large visual brand card — cover image, logo, name, short description and
 * real counts, with a hover zoom + gradient overlay. Brands with no
 * published products render muted and unlinked (a link into an empty range
 * is worse than no link), matching the rule the plain-text version already
 * followed.
 */
export function BrandCard({ brand }: { brand: BrandView }) {
  const hasProducts = brand.productCount > 0;
  const cover = brand.banner ?? brand.mobileCoverImage;

  const content = (
    <>
      <div className="absolute inset-0">
        <SafeImage
          src={cover ?? ""}
          alt=""
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          placeholderLabel={brand.name}
          className={cn(
            "object-cover object-center transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
            hasProducts && "group-hover:scale-[1.06]"
          )}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/20 to-transparent" />
        {!hasProducts && <div className="absolute inset-0 bg-ink/40" />}
      </div>

      <div className="relative flex h-full flex-col justify-end p-6 md:p-8">
        {brand.logo && (
          <div className="relative mb-4 h-10 w-24 origin-left">
            <Image src={brand.logo} alt="" fill sizes="96px" className="object-contain object-left brightness-0 invert" />
          </div>
        )}

        <h3 className="text-2xl font-semibold tracking-tight text-ivory md:text-3xl">{brand.name}</h3>

        {brand.shortDescription && (
          <p className="mt-2 line-clamp-2 max-w-sm text-sm text-ivory/70">{brand.shortDescription}</p>
        )}

        <div className="mt-4 flex items-center gap-4 text-xs font-medium uppercase tracking-wide text-ivory/60">
          <span>
            {brand.productCount} Product{brand.productCount === 1 ? "" : "s"}
          </span>
          {brand.categoryCount > 0 && (
            <span>
              {brand.categoryCount} Categor{brand.categoryCount === 1 ? "y" : "ies"}
            </span>
          )}
        </div>

        {hasProducts ? (
          <span className="mt-5 inline-flex w-fit items-center gap-2 border-b border-gold/60 pb-1 text-sm font-medium text-gold transition-colors group-hover:border-gold group-hover:text-gold-bright">
            Explore Collection
            <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        ) : (
          <span className="mt-5 text-sm text-ivory/40">Coming soon</span>
        )}
      </div>
    </>
  );

  const className = "group relative block aspect-[4/5] w-full overflow-hidden rounded-3xl bg-ink";

  if (!hasProducts) {
    return <div className={className}>{content}</div>;
  }

  return (
    <Link href={`/brands/${brand.slug}`} className={className} aria-label={`Explore ${brand.name}`}>
      {content}
    </Link>
  );
}
