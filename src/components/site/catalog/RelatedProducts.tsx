"use client";

import type { CatalogProduct } from "@/lib/catalog";
import { ProductCard } from "@/components/site/catalog/ProductCard";
import { RevealStagger, RevealItem } from "@/components/motion/Reveal";

export function RelatedProducts({ products }: { products: CatalogProduct[] }) {
  return (
    <RevealStagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" stagger={0.1}>
      {products.map((p) => (
        <RevealItem key={p.slug}>
          <ProductCard product={p} />
        </RevealItem>
      ))}
    </RevealStagger>
  );
}
