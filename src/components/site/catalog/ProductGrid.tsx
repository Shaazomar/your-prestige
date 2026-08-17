import type { CatalogProduct } from "@/lib/catalog";
import { cn } from "@/lib/utils";
import { ProductCard } from "./ProductCard";
import { SkeletonProductGrid } from "@/components/ui/Skeleton";

interface ProductGridProps {
  products: CatalogProduct[];
  loading?: boolean;
  /** Rendered when the list is empty — filters cleared, no results, etc. */
  empty?: React.ReactNode;
  /** How many leading cards get `priority` on their image. */
  priorityCount?: number;
  className?: string;
}

/**
 * The catalogue grid.
 *
 * Column counts step 2 → 3 → 4. Four is the ceiling even on very wide
 * screens: a fifth column pushes each tile below the size where its
 * surface pattern is still readable, which defeats the point of the page.
 *
 * The row gap is deliberately much larger than the column gap — the type
 * hanging under each image needs room to group with its own image rather
 * than the one below it.
 */
export function ProductGrid({
  products,
  loading = false,
  empty,
  priorityCount = 4,
  className,
}: ProductGridProps) {
  if (loading) return <SkeletonProductGrid count={8} />;

  if (products.length === 0) {
    return (
      empty ?? (
        <div className="col-span-full py-24 text-center">
          <p className="text-h4 text-text">No surfaces match those filters</p>
          <p className="mt-2 text-sm text-muted">
            Try removing a filter, or search by tile name, size or brand.
          </p>
        </div>
      )
    );
  }

  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 md:gap-x-6 md:gap-y-12 xl:grid-cols-4 xl:gap-x-8 xl:gap-y-14",
        className
      )}
    >
      {products.map((product, i) => (
        <ProductCard
          key={product.slug}
          product={product}
          priority={i < priorityCount}
        />
      ))}
    </div>
  );
}
