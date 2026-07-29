"use client";

import { Heart } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useLocalCollection, WISHLIST_KEY } from "@/hooks/useLocalCollection";

/**
 * Saves a product to the visitor's selection.
 *
 * Renders nothing until the stored list has been read, because the filled and
 * outlined states differ and flashing the wrong one on every page load reads
 * as a bug.
 */
export function WishlistButton({
  slug,
  name,
  variant = "icon",
  className,
}: {
  slug: string;
  name: string;
  variant?: "icon" | "full";
  className?: string;
}) {
  const wishlist = useLocalCollection(WISHLIST_KEY, 60);
  const saved = wishlist.has(slug);

  function handleClick(e: React.MouseEvent) {
    // These sit inside product cards, which are themselves links.
    e.preventDefault();
    e.stopPropagation();
    const nowSaved = wishlist.toggle(slug);
    toast.success(nowSaved ? `${name} saved to your selection` : `${name} removed`, {
      action: nowSaved ? { label: "View selection", onClick: () => (window.location.href = "/wishlist") } : undefined,
    });
  }

  if (variant === "full") {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-pressed={saved}
        className={cn(
          "inline-flex items-center gap-2 rounded-full border px-6 py-3 text-sm font-medium transition-colors duration-300",
          saved ? "border-gold bg-gold/10 text-gold" : "border-ink/15 hover:border-gold/50",
          !wishlist.ready && "invisible",
          className
        )}
      >
        <Heart className={cn("h-4 w-4", saved && "fill-current")} />
        {saved ? "Saved" : "Save to selection"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={saved ? `Remove ${name} from your selection` : `Save ${name} to your selection`}
      aria-pressed={saved}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-sm transition-colors duration-300",
        saved ? "bg-gold text-white" : "bg-black/25 text-white/90 hover:bg-black/45",
        !wishlist.ready && "invisible",
        className
      )}
    >
      <Heart className={cn("h-4 w-4", saved && "fill-current")} />
    </button>
  );
}
