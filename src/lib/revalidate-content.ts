import { revalidatePath } from "next/cache";
import { resolveCategory } from "@/lib/products";

/**
 * Push a CMS change onto the public site immediately.
 *
 * The catalogue pages are ISR: the product page holds for an hour, the
 * listings for ten minutes. Nothing in the product, brand, category or
 * collection actions ever called `revalidatePath`, so an editor who replaced
 * a product photo saw the old one on the site for up to an hour and had no
 * way to tell whether the save had worked. Reloading did not help — the cached
 * render is served to everyone, so it is not something a hard refresh can fix.
 *
 * Every helper here is best-effort: a revalidation failure must never roll
 * back a save that already succeeded, so each is wrapped. The worst case is
 * the previous behaviour, which is the page refreshing on its own schedule.
 */

function safeRevalidate(path: string) {
  try {
    revalidatePath(path);
  } catch (err) {
    // Not fatal: the write is already committed and the page will refresh when
    // its own `revalidate` window elapses.
    console.error(`revalidatePath("${path}") failed:`, err);
  }
}

export interface ProductRevalidationTarget {
  slug: string;
  designerPick?: boolean | null;
  category?: {
    slug: string;
    name: string;
    parent?: { slug: string; name: string; parent?: { slug: string; name: string } | null } | null;
  } | null;
  brand?: { slug: string } | null;
}

/**
 * Everywhere one product can appear.
 *
 * The product's own URL uses the section it resolves to, matching its
 * canonical, and its category and brand listings are refreshed too because the
 * card image on those pages comes from the same record.
 */
export function revalidateProduct(product: ProductRevalidationTarget) {
  const section = resolveCategory(product);
  safeRevalidate(`/products/${section}/${product.slug}`);
  safeRevalidate("/products");

  const sectionRoot =
    product.category?.parent?.parent?.slug ??
    product.category?.parent?.slug ??
    product.category?.slug;

  if (sectionRoot === "tiles" || sectionRoot === "bathware") {
    safeRevalidate(`/${sectionRoot}`);
    if (product.category?.slug) safeRevalidate(`/${sectionRoot}/${product.category.slug}`);
    if (product.category?.parent?.slug) {
      safeRevalidate(`/${sectionRoot}/${product.category.parent.slug}`);
    }
  }

  if (product.brand?.slug) {
    safeRevalidate(`/brands/${product.brand.slug}`);
    if (product.category?.slug) {
      safeRevalidate(`/brands/${product.brand.slug}/${product.category.slug}`);
    }
  }
}

export function revalidateBrand(slug: string) {
  safeRevalidate(`/brands/${slug}`);
  safeRevalidate("/brands");
  // The mega-menu and footer read the brand list, and both are rendered in the
  // shared site layout — so the homepage has to be refreshed for a new logo to
  // appear in the navigation.
  safeRevalidate("/");
}

export function revalidateCategory(slug: string, sectionSlug?: string | null) {
  if (sectionSlug === "tiles" || sectionSlug === "bathware") {
    safeRevalidate(`/${sectionSlug}`);
    safeRevalidate(`/${sectionSlug}/${slug}`);
  } else {
    safeRevalidate(`/tiles/${slug}`);
    safeRevalidate(`/bathware/${slug}`);
  }
  // Category imagery drives the mega-menu panels.
  safeRevalidate("/");
}

export function revalidateCollection(slug: string) {
  safeRevalidate(`/collections/${slug}`);
  safeRevalidate("/collections");
}

export function revalidateHomepage() {
  safeRevalidate("/");
}
