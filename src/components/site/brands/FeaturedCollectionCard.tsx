import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SafeImage } from "@/components/ui/SafeImage";

export interface FeaturedCollectionView {
  slug: string;
  name: string;
  description: string | null;
  image: string | null;
  count: number;
}

/** Admin-curated Featured Collection card (e.g. Jaquar's "Signature Bath"). Links into the brand page filtered to that collection. */
export function FeaturedCollectionCard({ brandSlug, collection }: { brandSlug: string; collection: FeaturedCollectionView }) {
  return (
    <Link
      href={`/brands/${brandSlug}?collection=${encodeURIComponent(collection.name)}`}
      className="group relative block aspect-[3/4] overflow-hidden rounded-2xl bg-stone-100"
    >
      <SafeImage
        src={collection.image ?? ""}
        alt=""
        fill
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        placeholderLabel={collection.name}
        className="object-cover object-center transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.05]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/15 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 p-5">
        <h3 className="text-lg font-semibold text-ivory">{collection.name}</h3>
        {collection.description && (
          <p className="mt-1 line-clamp-2 text-xs text-ivory/65">{collection.description}</p>
        )}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-ivory/60">
            {collection.count} piece{collection.count === 1 ? "" : "s"}
          </span>
          <ArrowUpRight className="h-4 w-4 text-gold opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
      </div>
    </Link>
  );
}
