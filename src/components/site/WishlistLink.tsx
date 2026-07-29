"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocalCollection, WISHLIST_KEY } from "@/hooks/useLocalCollection";

/**
 * Header entry point to the saved selection, with a live count.
 *
 * Hidden entirely when nothing is saved — an always-visible empty wishlist is
 * noise in a header this restrained, and the heart on each product card is
 * where the feature is actually discovered.
 */
export function WishlistLink({ dark = false }: { dark?: boolean }) {
  const wishlist = useLocalCollection(WISHLIST_KEY, 60);

  if (!wishlist.ready || wishlist.items.length === 0) return null;

  return (
    <Link
      href="/wishlist"
      aria-label={`Your selection — ${wishlist.items.length} saved`}
      className={cn(
        "relative hidden h-10 w-10 items-center justify-center rounded-full border transition-colors duration-500 sm:flex",
        dark
          ? "border-ivory/25 text-ivory hover:border-gold hover:text-gold"
          : "border-ink/12 text-ink hover:border-gold hover:text-gold"
      )}
    >
      <Heart className="h-4 w-4" />
      <span className="absolute -right-1 -top-1 flex h-4.5 min-w-[1.125rem] items-center justify-center rounded-full bg-gold px-1 text-[0.6rem] font-semibold leading-none text-white">
        {wishlist.items.length}
      </span>
    </Link>
  );
}
