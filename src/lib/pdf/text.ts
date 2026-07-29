import type { PdfDocumentHandle, PdfTextItem } from "./document";

/**
 * Page text with geometry.
 *
 * Plain concatenated text loses the thing that makes a catalogue parseable:
 * *where* each string sits. "Dune Taupe" being directly above "Size: 800x1600"
 * and beside a photo is the entire signal. So every item keeps its x/y, and
 * items are clustered into visual blocks that usually correspond to one
 * product's caption.
 */

export interface TextItem {
  str: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface TextBlock {
  /** Lines joined with \n, reading order preserved. */
  text: string;
  x: number;
  y: number;
  w: number;
  h: number;
  items: TextItem[];
}

export interface PageText {
  page: number;
  width: number;
  height: number;
  text: string;
  items: TextItem[];
  blocks: TextBlock[];
}

export async function extractPageText(
  doc: PdfDocumentHandle,
  pageNum: number
): Promise<PageText> {
  const page = await doc.getPage(pageNum);
  try {
    const viewport = page.getViewport({ scale: 1 });
    const content = await page.getTextContent();

    const items: TextItem[] = content.items
      .filter((i: PdfTextItem) => typeof i.str === "string" && i.str.trim().length > 0)
      .map((i: PdfTextItem) => ({
        str: i.str,
        // transform is [a,b,c,d,e,f]; e/f are the translation, d the font scale.
        x: i.transform[4],
        y: i.transform[5],
        w: i.width ?? 0,
        h: i.height || Math.abs(i.transform[3]) || 10,
      }));

    return {
      page: pageNum,
      width: viewport.width,
      height: viewport.height,
      text: items.map((i) => i.str).join(" "),
      items,
      blocks: clusterBlocks(items),
    };
  } finally {
    page.cleanup();
  }
}

/**
 * Group text items into blocks.
 *
 * Two passes: items on roughly the same baseline become a line, then lines that
 * are vertically adjacent *and* horizontally overlapping become a block. The
 * horizontal-overlap test is what keeps a two-up catalogue page from merging
 * the left product's caption into the right product's.
 */
export function clusterBlocks(items: TextItem[]): TextBlock[] {
  if (items.length === 0) return [];

  const medianH = median(items.map((i) => i.h)) || 10;
  const lineTol = medianH * 0.6;

  // — Pass 1: lines —
  const sorted = [...items].sort((a, b) => b.y - a.y || a.x - b.x);
  const lines: TextItem[][] = [];
  for (const item of sorted) {
    const line = lines.find((l) => Math.abs(l[0].y - item.y) <= lineTol);
    if (line) line.push(item);
    else lines.push([item]);
  }
  for (const l of lines) l.sort((a, b) => a.x - b.x);

  // — Pass 2: blocks —
  const lineBoxes = lines.map((l) => ({ items: l, ...bbox(l) })).sort((a, b) => b.y - a.y);
  const gapTol = medianH * 1.8;

  const blocks: { items: TextItem[]; x: number; y: number; w: number; h: number }[] = [];
  for (const lb of lineBoxes) {
    const target = blocks.find((b) => {
      const verticallyClose = b.y - (lb.y + lb.h) <= gapTol && b.y + b.h >= lb.y - gapTol;
      const overlap = Math.min(b.x + b.w, lb.x + lb.w) - Math.max(b.x, lb.x);
      const horizontallyAligned = overlap > Math.min(b.w, lb.w) * 0.35;
      return verticallyClose && horizontallyAligned;
    });
    if (target) {
      target.items.push(...lb.items);
      Object.assign(target, bbox(target.items));
    } else {
      blocks.push({ items: [...lb.items], x: lb.x, y: lb.y, w: lb.w, h: lb.h });
    }
  }

  return blocks
    .map((b) => ({ ...b, text: renderBlockText(b.items, lineTol) }))
    .sort((a, b) => b.y - a.y || a.x - b.x);
}

/** Re-join a block's items into lines, preserving reading order. */
function renderBlockText(items: TextItem[], lineTol: number): string {
  const rows: TextItem[][] = [];
  for (const item of [...items].sort((a, b) => b.y - a.y || a.x - b.x)) {
    const row = rows.find((r) => Math.abs(r[0].y - item.y) <= lineTol);
    if (row) row.push(item);
    else rows.push([item]);
  }
  return rows
    .map((r) => r.sort((a, b) => a.x - b.x).map((i) => i.str).join(" ").replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}

function bbox(items: TextItem[]) {
  const x = Math.min(...items.map((i) => i.x));
  const y = Math.min(...items.map((i) => i.y));
  const maxX = Math.max(...items.map((i) => i.x + i.w));
  const maxY = Math.max(...items.map((i) => i.y + i.h));
  return { x, y, w: maxX - x, h: maxY - y };
}

function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const s = [...nums].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

/** Fraction of page height at top and bottom treated as the header/footer band. */
const CHROME_BAND = 0.12;

/**
 * Running headers, footers, page numbers and legal boilerplate.
 *
 * Repetition alone is not enough to identify these. In a tile catalogue
 * "Thickness: 9 mm" and "Material: Glazed Vitrified" repeat on nearly every
 * page because most of the range shares those specs — stripping them as
 * boilerplate would delete the very fields we're trying to extract.
 *
 * So a line only counts as chrome when it repeats *and* sits in the top or
 * bottom band of the page *and* holds roughly the same vertical position each
 * time. Spec text lives in the body and moves with the layout; a masthead does
 * not.
 */
export function findRepeatedLines(pages: PageText[], threshold = 0.5): Set<string> {
  if (pages.length < 3) return new Set();

  const seenAt = new Map<string, { pages: Set<number>; ys: number[] }>();

  for (const p of pages) {
    const topBand = p.height * (1 - CHROME_BAND);
    const bottomBand = p.height * CHROME_BAND;

    for (const item of p.items) {
      const key = normalise(item.str);
      // Bare numbers are page numbers — repetition is meaningless for them.
      if (key.length < 3 || /^\d+$/.test(key)) continue;
      if (item.y < topBand && item.y > bottomBand) continue; // body text

      if (!seenAt.has(key)) seenAt.set(key, { pages: new Set(), ys: [] });
      const entry = seenAt.get(key)!;
      if (!entry.pages.has(p.page)) {
        entry.pages.add(p.page);
        entry.ys.push(item.y);
      }
    }
  }

  const min = Math.max(2, Math.ceil(pages.length * threshold));
  const out = new Set<string>();

  for (const [key, { pages: seen, ys }] of seenAt) {
    if (seen.size < min) continue;
    // Anchored to the same height each time? Then it's chrome, not content.
    const spread = Math.max(...ys) - Math.min(...ys);
    if (spread <= 24) out.add(key);
  }
  return out;
}

export const normalise = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
