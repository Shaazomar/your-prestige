import type { CachedPage } from "@/lib/import/types";

/**
 * Document-level facts that no single text block carries: which brand this
 * catalogue belongs to, and which collection a given page is showing.
 *
 * Both are positional rather than semantic. A brand name is the string that
 * repeats in the header of nearly every page; a collection heading is a short,
 * prominent line near the top of a page that persists until the next one
 * replaces it. That "persists until replaced" behaviour matters — brands print
 * the collection name once on a spread's opening page, not on every product.
 */

const COLLECTION_HINT = /\b(collection|series|range|concept|edition|studio)\b/i;

export function detectBrand(pages: CachedPage[], boilerplate: Set<string>): string | null {
  if (boilerplate.size === 0) return null;

  // Among repeated header/footer lines, prefer the one that reads like a
  // company name: short, mostly letters, no URL, no page furniture words.
  const candidates = [...boilerplate]
    .map((s) => s.trim())
    .filter(
      (s) =>
        s.length >= 3 &&
        s.length <= 40 &&
        !/^www\.|@|\.com|\bpage\b|^\d/i.test(s) &&
        !COLLECTION_HINT.test(s) &&
        /[a-z]/i.test(s)
    );
  if (candidates.length === 0) return null;

  // Header beats footer: find where each appears on the first page that has it.
  const topPositions = new Map<string, number>();
  for (const page of pages) {
    for (const block of page.blocks) {
      const key = block.text.toLowerCase().trim();
      if (!candidates.includes(key) || topPositions.has(key)) continue;
      topPositions.set(key, block.y / page.height);
    }
  }

  const best = candidates
    .map((c) => ({ c, y: topPositions.get(c) ?? 0 }))
    .sort((a, b) => b.y - a.y)[0];

  return best ? titleCaseBrand(best.c) : null;
}

/**
 * Map each page to the collection in force on it, carrying the most recent
 * heading forward across pages that don't restate it.
 */
export function detectCollections(
  pages: CachedPage[],
  boilerplate: Set<string>
): Map<number, string> {
  const byPage = new Map<number, string>();
  let current: string | null = null;

  for (const page of [...pages].sort((a, b) => a.page - b.page)) {
    const heading = page.blocks
      // Upper third of the page, where headings live.
      .filter((b) => b.y > page.height * 0.62)
      .map((b) => b.text.split("\n")[0].trim())
      .find(
        (text) =>
          text.length >= 4 &&
          text.length <= 60 &&
          !boilerplate.has(text.toLowerCase()) &&
          COLLECTION_HINT.test(text)
      );

    if (heading) current = heading.replace(/\s{2,}/g, " ");
    if (current) byPage.set(page.page, current);
  }
  return byPage;
}

function titleCaseBrand(s: string): string {
  return s
    .split(/\s+/)
    .map((w) => (w.length <= 3 && w === w.toUpperCase() ? w : w[0].toUpperCase() + w.slice(1).toLowerCase()))
    .join(" ");
}
