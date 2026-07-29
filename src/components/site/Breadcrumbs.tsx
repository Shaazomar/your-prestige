import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { siteUrl } from "@/lib/site-config";

/**
 * Breadcrumb trail plus its BreadcrumbList schema.
 *
 * The two are emitted together on purpose: search engines penalise structured
 * data that doesn't correspond to something visible on the page, so keeping
 * the markup and the JSON-LD in one component means they can't drift apart.
 */

export interface Crumb {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items, dark = false }: { items: Crumb[]; dark?: boolean }) {
  const trail: Crumb[] = [{ label: "Home", href: "/" }, ...items];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.label,
      // The final crumb is the current page and carries no item URL.
      ...(c.href ? { item: `${siteUrl}${c.href}` } : {}),
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs">
        {trail.map((c, i) => (
          <span key={`${c.label}-${i}`} className="flex items-center gap-1.5">
            {i > 0 && (
              <ChevronRight className={dark ? "h-3 w-3 text-ivory/30" : "h-3 w-3 text-ink/25"} />
            )}
            {c.href ? (
              <Link
                href={c.href}
                className={
                  dark
                    ? "text-ivory/50 transition-colors hover:text-gold"
                    : "text-ink/45 transition-colors hover:text-gold"
                }
              >
                {c.label}
              </Link>
            ) : (
              <span aria-current="page" className={dark ? "text-ivory/80" : "text-ink/70"}>
                {c.label}
              </span>
            )}
          </span>
        ))}
      </nav>
    </>
  );
}
