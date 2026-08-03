import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface ProductCardProps {
  href: string;
  name: string;
  finish?: string | null;
  size?: string | null;
  image: string;
  blurDataURL?: string;
  /** Optional corner flag — "New Arrival", "Bestseller". Used sparingly. */
  tag?: string | null;
  priority?: boolean;
  sizes?: string;
  className?: string;
}

/**
 * Deliberately quiet: image, name, finish · size. No price, no badges beyond
 * an optional tag, no "add to cart" — this is a catalogue, not a store.
 */
export function ProductCard({
  href,
  name,
  finish,
  size,
  image,
  blurDataURL,
  tag,
  priority = false,
  sizes = "(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw",
  className,
}: ProductCardProps) {
  const spec = [finish, size].filter(Boolean).join(" · ");

  return (
    <Link href={href} className={cn("group block", className)}>
      <div className="hover-zoom media-frame aspect-[4/5]">
        <Image
          src={image}
          alt=""
          fill
          sizes={sizes}
          priority={priority}
          placeholder={blurDataURL ? "blur" : undefined}
          blurDataURL={blurDataURL}
          className="object-cover"
        />
        {tag && (
          <span className="absolute left-4 top-4 rounded-full bg-canvas/70 px-3 py-1.5 text-[0.6875rem] font-medium tracking-wide text-text backdrop-blur-md">
            {tag}
          </span>
        )}
      </div>

      <div className="pt-5">
        <h3 className="text-base font-medium leading-snug text-text transition-colors duration-500 group-hover:text-gold">
          {name}
        </h3>
        {spec && <p className="mt-1.5 text-sm text-faint">{spec}</p>}
      </div>
    </Link>
  );
}
