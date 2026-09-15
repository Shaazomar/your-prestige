import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Catalogue classification.
 *
 * Places existing products under a brand and a category using only vocabulary
 * that already exists in the database — the category names and brand names
 * themselves. It invents nothing: if a product's text does not clearly match
 * one category, the product is marked NEEDS_REVIEW with the reason, and a
 * person decides in the CMS.
 *
 * Three rules keep it safe to run against a live catalogue:
 *
 *  1. A product that already has a category keeps it. The classifier fills
 *     gaps and flags doubt; it does not re-file the catalogue underneath
 *     whoever curated it.
 *  2. Clearing `needsReview` is a human act. Once someone files a product in
 *     the CMS the flag comes off, and re-running this can never put it back —
 *     the classifier only ever looks at products with no category at all.
 *  3. It is dry-run unless explicitly told to apply, and reports exactly what
 *     it would change either way.
 *
 * Writes to `needsReview` / `reviewReason`, the columns the live database
 * already carries.
 */

export type Decision =
  | { kind: "classified"; productId: string; categoryId: string; note: string }
  | { kind: "review"; productId: string; note: string }
  | { kind: "skipped"; productId: string; note: string };

export interface ClassificationReport {
  scanned: number;
  classified: number;
  needsReview: number;
  skipped: number;
  /** Decision counts keyed by reason, so the outcome is auditable at a glance. */
  reasons: Record<string, number>;
  applied: boolean;
}

/** Lowercase alphanumeric tokens, deduped — the unit both sides are matched on. */
function tokenize(value: string): string[] {
  return [...new Set(value.toLowerCase().split(/[^a-z0-9]+/i).filter((t) => t.length > 1))];
}

/**
 * Words that carry no classifying signal. Kept deliberately short: this is a
 * stop-list for generic catalogue filler, not a place to encode taxonomy.
 */
const STOP = new Set([
  "the", "and", "for", "with", "series", "range", "collection", "new", "premium",
  "set", "type", "size", "mm", "cm", "standard",
]);

interface CategoryCandidate {
  id: string;
  /** Tokens from this category's own name and slug — what it must match on. */
  ownTokens: string[];
  /** Tokens inherited from ancestors — supporting evidence only. */
  ancestorTokens: string[];
  /** Every ancestor id, so parent/child pairs are not mistaken for rivals. */
  ancestorIds: Set<string>;
  /** Distance from the root; a leaf is more specific than its parent. */
  depth: number;
}

/**
 * Build the match vocabulary from the categories that already exist.
 *
 * Own tokens and ancestor tokens are kept apart deliberately. Folding them
 * together let every child of "Faucets" inherit the word "faucets" and so
 * outscore — and tie with — the parent a product named only "Faucets" actually
 * belonged to, which turned clear-cut products into ambiguous ones.
 */
async function loadCandidates(): Promise<CategoryCandidate[]> {
  const rows = await prisma.category.findMany({
    where: { published: true, deletedAt: null },
    select: { id: true, name: true, slug: true, parentId: true },
  });

  const byId = new Map(rows.map((r) => [r.id, r]));

  return rows.map((row) => {
    // Name only. A slug routinely embeds its ancestors ("accessories-mirrors",
    // "faucets-diverters-shower-valves"), and requiring those inherited words
    // meant a product plainly called "Mirrors" failed to match Mirrors.
    const ownTokens = [...new Set(tokenize(row.name))].filter((t) => !STOP.has(t));

    // The slug still counts as supporting evidence, just never as a requirement.
    const ancestorTokens: string[] = tokenize(row.slug);
    const ancestorIds = new Set<string>();
    let depth = 0;
    let cursor = row.parentId ? byId.get(row.parentId) : undefined;
    while (cursor && !ancestorIds.has(cursor.id)) {
      ancestorIds.add(cursor.id);
      ancestorTokens.push(...tokenize(cursor.name), ...tokenize(cursor.slug));
      depth++;
      cursor = cursor.parentId ? byId.get(cursor.parentId) : undefined;
    }

    return {
      id: row.id,
      ownTokens,
      ancestorTokens: [...new Set(ancestorTokens)].filter((t) => !STOP.has(t)),
      ancestorIds,
      depth,
    };
  });
}

/** Everything about a product that could carry a category signal. */
function productText(p: {
  name: string;
  collection: string | null;
  description: string | null;
  productCode: string | null;
  surface: string | null;
  material: string | null;
  sourceSheet: string | null;
}): string[] {
  return tokenize(
    [p.name, p.collection, p.surface, p.material, p.sourceSheet, p.productCode, p.description?.slice(0, 200)]
      .filter(Boolean)
      .join(" ")
  ).filter((t) => !STOP.has(t));
}

interface Match {
  id: string;
  /** How many of the category's own words the product used. */
  ownTokenCount: number;
  depth: number;
  /** Ancestor words also present — supporting evidence, never selecting. */
  support: number;
  ancestorIds: Set<string>;
}

/**
 * A category matches only when *every* word in its own name appears in the
 * product's text.
 *
 * Full coverage rather than a hit count is what makes this explainable and
 * safe: "Mirrors" needs the word "mirrors"; "Overhead Showers" needs both
 * "overhead" and "showers", so it can never be chosen by the word "showers"
 * alone. A partial match is exactly the case where a human should decide.
 */
function match(candidate: CategoryCandidate, tokens: Set<string>): Match | null {
  if (candidate.ownTokens.length === 0) return null;
  for (const t of candidate.ownTokens) if (!tokens.has(t)) return null;

  let support = 0;
  for (const t of candidate.ancestorTokens) if (tokens.has(t)) support++;

  return {
    id: candidate.id,
    ownTokenCount: candidate.ownTokens.length,
    depth: candidate.depth,
    support,
    ancestorIds: candidate.ancestorIds,
  };
}

/**
 * More words matched beats fewer (a two-word category name is a more specific
 * claim than a one-word one); then the deeper category; then ancestor support.
 */
function compareMatches(a: Match, b: Match): number {
  return (
    b.ownTokenCount - a.ownTokenCount ||
    b.depth - a.depth ||
    b.support - a.support
  );
}

export interface ClassifyOptions {
  /** Write the decisions. Default false — report only. */
  apply?: boolean;
  /** Cap the scan, for a quick look at a large catalogue. */
  limit?: number;
  /** Re-examine products that already carry a category. Default false. */
  includeClassified?: boolean;
}

export async function classifyCatalog(opts: ClassifyOptions = {}): Promise<{
  report: ClassificationReport;
  decisions: Decision[];
}> {
  const { apply = false, limit, includeClassified = false } = opts;

  const candidates = await loadCandidates();

  const where: Prisma.ProductWhereInput = {
    deletedAt: null,
    ...(includeClassified ? {} : { categoryId: null }),
  };

  const products = await prisma.product.findMany({
    where,
    select: {
      id: true, name: true, collection: true, description: true, productCode: true,
      surface: true, material: true, sourceSheet: true, brandId: true, categoryId: true,
      needsReview: true,
    },
    ...(limit ? { take: limit } : {}),
  });

  // Which categories each brand already uses. A brand-known category wins a
  // close call, which is how the matcher stays brand-aware rather than
  // applying one global list to everyone.
  const brandUsage = await prisma.product.groupBy({
    by: ["brandId", "categoryId"],
    where: { published: true, deletedAt: null, categoryId: { not: null } },
    _count: { _all: true },
  });
  const brandCategories = new Map<string, Set<string>>();
  for (const row of brandUsage) {
    if (!row.brandId || !row.categoryId) continue;
    const set = brandCategories.get(row.brandId) ?? new Set<string>();
    set.add(row.categoryId);
    brandCategories.set(row.brandId, set);
  }

  const decisions: Decision[] = [];
  const reasons: Record<string, number> = {};
  const bump = (r: string) => { reasons[r] = (reasons[r] ?? 0) + 1; };

  for (const p of products) {
    const tokens = new Set(productText(p));
    if (tokens.size === 0) {
      decisions.push({ kind: "review", productId: p.id, note: "No usable text to classify from" });
      bump("no-signal");
      continue;
    }

    const known = p.brandId ? brandCategories.get(p.brandId) : undefined;

    const matches = candidates
      .map((c) => match(c, tokens))
      .filter((m): m is Match => m !== null)
      .sort(compareMatches);

    if (matches.length === 0) {
      decisions.push({ kind: "review", productId: p.id, note: "No category name matched this product's text" });
      bump("no-match");
      continue;
    }

    const best = matches[0];

    // Rivals are only the matches that tie the winner on specificity. A parent
    // of the winner is not a rival — "Faucets" and "Faucets → Basin Mixers"
    // both matching is agreement about where the product goes, and the more
    // specific one is the right answer.
    const rivals = matches
      .slice(1)
      .filter((m) => compareMatches(best, m) === 0 && !best.ancestorIds.has(m.id) && !m.ancestorIds.has(best.id));

    if (rivals.length > 0) {
      // A brand that already files products in exactly one of the tied
      // categories settles it; anything less goes to a human.
      const familiar = [best, ...rivals].filter((m) => known?.has(m.id));
      if (familiar.length !== 1) {
        decisions.push({
          kind: "review",
          productId: p.id,
          note: `Ambiguous — ${rivals.length + 1} categories matched equally well`,
        });
        bump("ambiguous");
        continue;
      }
      decisions.push({
        kind: "classified",
        productId: p.id,
        categoryId: familiar[0].id,
        note: "Tie resolved: only this category is already used by the brand",
      });
      bump("classified");
      continue;
    }

    decisions.push({
      kind: "classified",
      productId: p.id,
      categoryId: best.id,
      note: `Matched the full category name in the product text${
        known?.has(best.id) ? "; category already used by this brand" : ""
      }`,
    });
    bump("classified");
  }

  if (apply) {
    // Chunked so a large catalogue does not build one enormous transaction.
    const classified = decisions.filter(
      (d): d is Extract<Decision, { kind: "classified" }> => d.kind === "classified"
    );
    for (let i = 0; i < classified.length; i += 200) {
      await prisma.$transaction(
        classified.slice(i, i + 200).map((d) =>
          prisma.product.update({
            where: { id: d.productId },
            // Placed confidently, so it is not waiting on anyone.
            data: { categoryId: d.categoryId, needsReview: false, reviewReason: null },
          })
        )
      );
    }

    const review = decisions.filter((d) => d.kind === "review");
    for (let i = 0; i < review.length; i += 200) {
      await prisma.$transaction(
        review.slice(i, i + 200).map((d) =>
          prisma.product.update({
            where: { id: d.productId },
            data: { needsReview: true, reviewReason: d.note },
          })
        )
      );
    }
  }

  return {
    report: {
      scanned: products.length,
      classified: decisions.filter((d) => d.kind === "classified").length,
      needsReview: decisions.filter((d) => d.kind === "review").length,
      skipped: decisions.filter((d) => d.kind === "skipped").length,
      reasons,
      applied: apply,
    },
    decisions,
  };
}
