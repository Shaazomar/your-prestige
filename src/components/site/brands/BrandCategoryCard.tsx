import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SafeImage } from "@/components/ui/SafeImage";
import type { BrandCategoryView } from "@/lib/brands";

/** Visual "Shop by Category" card — image, name, real count, hover arrow, entire card clickable. */
export function BrandCategoryCard({
  brandSlug,
  brandName,
  category,
}: {
  brandSlug: string;
  /** The brand's display name, for alt text — `brandSlug` alone reads as "jaquar", not "Jaquar". */
  brandName?: string;
  category: BrandCategoryView;
}) {
  return (
    <Link
      href={`/brands/${brandSlug}/${category.slug}`}
      className="group relative block aspect-[4/3] overflow-hidden rounded-2xl bg-stone-100"
    >
      <SafeImage
        src={category.image ?? ""}
        alt={brandName ? `${category.name} by ${brandName} at Prestige` : `${category.name} at Prestige`}
        fill
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
        placeholderLabel={category.name}
        className="object-cover object-center transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.05]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 p-4 md:p-5">
        <h3 className="text-base font-semibold text-ivory md:text-lg">{category.name}</h3>
        <div className="mt-1 flex items-center justify-between">
          <span className="text-xs text-ivory/65">
            {category.count} Product{category.count === 1 ? "" : "s"}
          </span>
          <ArrowUpRight className="h-4 w-4 text-gold opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
      </div>
    </Link>
  );
}
