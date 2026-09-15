import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Crumb {
  label: string;
  /** Omitted on the final crumb — the page you are already on. */
  href?: string;
}

/**
 * Catalogue breadcrumbs.
 *
 * Emits BreadcrumbList JSON-LD alongside the visible trail so the same
 * hierarchy Google reads is the one a visitor clicks; they cannot drift apart
 * because both come from this one array.
 */
export function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  if (items.length === 0) return null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.label,
      ...(c.href ? { item: c.href } : {}),
    })),
  };

  return (
    <nav aria-label="Breadcrumb" className={cn("w-full", className)}>
      <script
        type="application/ld+json"
        // Server-rendered from our own data — no user input reaches this.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Scrolls rather than wraps on a phone, so a deep trail never pushes
          the page into a horizontal scroll of its own. */}
      <ol className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap pb-1 text-[0.78rem] text-ink/45 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((crumb, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${crumb.label}-${i}`} className="flex shrink-0 items-center gap-1.5">
              {i > 0 && <ChevronRight className="h-3 w-3 shrink-0 text-ink/25" aria-hidden="true" />}
              {crumb.href && !last ? (
                <Link
                  href={crumb.href}
                  className="transition-colors duration-200 hover:text-gold focus-visible:text-gold"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className={last ? "font-medium text-ink/75" : undefined} aria-current={last ? "page" : undefined}>
                  {crumb.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
