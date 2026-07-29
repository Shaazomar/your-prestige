/**
 * Associates extracted images with extracted products.
 *
 * Purely geometric, and deliberately so: a catalogue's layout already encodes
 * the answer. A photograph sits beside or above the caption describing it, and
 * both were placed by a designer following a consistent grid. Reading that grid
 * is more reliable than guessing from filenames or pixel dimensions.
 *
 * The algorithm is nearest-caption-wins, scored on distance with a strong bonus
 * for vertical band overlap — which is what makes a two-up spread resolve
 * correctly instead of assigning both photographs to whichever product happens
 * to be first.
 *
 * This is a first pass, not a verdict. The review UI lets an admin move any
 * asset to a different product, and that is expected to be needed on
 * design-led layouts where no geometry is consistent.
 */

export interface LinkableAsset {
  id: string;
  page: number;
  pageX: number | null;
  pageY: number | null;
  pageW: number | null;
  pageH: number | null;
  width: number;
  height: number;
  kind: string;
}

export interface LinkableProduct {
  id: string;
  pageStart: number;
  /** Caption bounding box in PDF user space, when known. */
  x?: number | null;
  y?: number | null;
  w?: number | null;
  h?: number | null;
}

export interface AssetAssignment {
  assetId: string;
  productId: string | null;
  role: "hero" | "texture" | "gallery";
}

export function linkAssets(
  assets: LinkableAsset[],
  products: LinkableProduct[]
): AssetAssignment[] {
  const assignments: AssetAssignment[] = [];
  const byPage = new Map<number, LinkableProduct[]>();
  for (const p of products) {
    if (!byPage.has(p.pageStart)) byPage.set(p.pageStart, []);
    byPage.get(p.pageStart)!.push(p);
  }

  const perProduct = new Map<string, LinkableAsset[]>();

  for (const asset of assets) {
    const candidates = byPage.get(asset.page) ?? [];
    if (candidates.length === 0) {
      assignments.push({ assetId: asset.id, productId: null, role: "gallery" });
      continue;
    }
    // Only one product on the page — no ambiguity to resolve.
    if (candidates.length === 1) {
      push(perProduct, candidates[0].id, asset);
      continue;
    }

    const best = nearest(asset, candidates);
    push(perProduct, best.id, asset);
  }

  // Assign roles within each product by how large the image was *printed*,
  // not how many pixels it contains. A 4000px texture swatch reproduced at
  // thumbnail size is not the hero; a 900px photo across half the page is.
  for (const [productId, list] of perProduct) {
    const ranked = [...list].sort((a, b) => printedArea(b) - printedArea(a));
    ranked.forEach((asset, i) => {
      let role: AssetAssignment["role"];
      if (i === 0) role = "hero";
      else if (i === 1 && isTextureLike(asset)) role = "texture";
      else role = "gallery";
      assignments.push({ assetId: asset.id, productId, role });
    });
  }

  return assignments;
}

function nearest(asset: LinkableAsset, candidates: LinkableProduct[]): LinkableProduct {
  const ax = centre(asset.pageX, asset.pageW);
  const ay = centre(asset.pageY, asset.pageH);

  let best = candidates[0];
  let bestScore = Infinity;

  for (const p of candidates) {
    if (p.x == null || p.y == null) continue;
    const px = centre(p.x, p.w);
    const py = centre(p.y, p.h);

    const dx = Math.abs(ax - px);
    const dy = Math.abs(ay - py);

    // Vertical proximity dominates: catalogues stack products down the page,
    // so two items sharing a horizontal band are the same product far more
    // often than two items sharing a column.
    const score = dy * 2 + dx;
    if (score < bestScore) {
      bestScore = score;
      best = p;
    }
  }
  return best;
}

function push(map: Map<string, LinkableAsset[]>, key: string, asset: LinkableAsset) {
  const list = map.get(key);
  if (list) list.push(asset);
  else map.set(key, [asset]);
}

const centre = (pos: number | null | undefined, size: number | null | undefined) =>
  (pos ?? 0) + (size ?? 0) / 2;

const printedArea = (a: LinkableAsset) =>
  (a.pageW ?? 0) * (a.pageH ?? 0) || a.width * a.height;

/** Square and tightly cropped reads as a material macro rather than a scene. */
function isTextureLike(a: LinkableAsset): boolean {
  if (a.kind === "texture") return true;
  const aspect = a.width / a.height;
  return aspect > 0.85 && aspect < 1.2;
}
