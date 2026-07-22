import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { products } from "@/lib/demo-content";

type Product = (typeof products)[number];

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/products/${product.category}/${product.slug}`}
      className="group block"
    >
      <div className="relative overflow-hidden rounded-3xl bg-stone-100">
        <div className="relative aspect-[4/5]">
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-[1.4s] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-108"
          />
        </div>
        <span className="glass absolute left-4 top-4 rounded-full px-3.5 py-1.5 text-xs font-semibold text-ink">
          {product.tag}
        </span>
        <span className="absolute bottom-4 right-4 flex h-11 w-11 translate-y-2 items-center justify-center rounded-full bg-ivory text-ink opacity-0 shadow-soft transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
          <ArrowUpRight className="h-5 w-5" />
        </span>
      </div>
      <div className="mt-5 flex items-start justify-between gap-4 px-1">
        <div>
          <h3 className="text-lg font-semibold tracking-tight text-ink transition-colors duration-300 group-hover:text-gold">
            {product.name}
          </h3>
          <p className="mt-1 text-sm text-stone-400">
            {product.brand} · {product.finish}
          </p>
        </div>
        <p className="shrink-0 pt-1 text-sm font-medium text-slate-warm">{product.size}</p>
      </div>
    </Link>
  );
}
