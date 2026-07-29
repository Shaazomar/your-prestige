import {
  COLORS_SORTED, FIELD_LABELS, FINISHES_SORTED, MATERIALS_SORTED,
  NAME_STOPWORDS, matchVocabulary, titleCase,
} from "./vocabulary";
import { normaliseApplications } from "@/lib/applications";
import type { Application } from "@/lib/catalog";

/**
 * Turns one clustered text block into a candidate product.
 *
 * Two complementary strategies, because catalogues split roughly in half:
 *
 * 1. **Labelled** — "Size: 800 x 1600 mm" on its own line. Parsed by matching
 *    the label, which is high confidence when it hits.
 * 2. **Unlabelled** — bare values scattered through a caption ("Dune Taupe /
 *    800x1600 / Matt"). Recovered by pattern and vocabulary, at lower confidence.
 *
 * Every field records how it was found, so the review UI can sort the doubtful
 * rows to the top instead of asking a human to re-check all of them.
 */

export interface ParsedProduct {
  name: string;
  productCode: string | null;
  collectionName: string | null;
  sizes: string[];
  finish: string | null;
  thickness: string | null;
  material: string | null;
  color: string | null;
  surface: string | null;
  applications: Application[];
  applicationTags: string[];
  description: string | null;
  rawText: string;
  confidence: number;
  fieldScores: Record<string, number>;
}

// "800 x 1600", "800X1600mm", "600 × 1200 mm", "1600x3200 MM"
const SIZE_RE = /(\d{2,4})\s*[x×X]\s*(\d{2,4})(?:\s*(?:mm|cm|MM|CM))?/g;
// "9 mm", "8.5mm", "10 MM"
const THICKNESS_RE = /(\d{1,2}(?:\.\d{1,2})?)\s*(?:mm|MM)\b/;
// "GVT-8016", "PGVT 6012", "AB1234"
const CODE_RE = /\b([A-Z]{2,6}[-\s]?\d{3,6}[A-Z]?)\b/;

export function parseBlock(
  text: string,
  context: { collection?: string | null; boilerplate?: Set<string> } = {}
): ParsedProduct | null {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((l) => !context.boilerplate?.has(l.toLowerCase()));

  if (lines.length === 0) return null;

  const scores: Record<string, number> = {};
  const labelled = new Map<string, string>();

  // — Pass 1: labelled fields —
  for (const line of lines) {
    const m = line.match(/^\s*([A-Za-z][A-Za-z .\/]{1,28}?)\s*[:：]\s*(.+)$/);
    if (!m) continue;
    const label = m[1].toLowerCase().trim().replace(/\s+/g, " ");
    const value = m[2].trim();
    for (const [field, aliases] of Object.entries(FIELD_LABELS)) {
      if (aliases.includes(label)) {
        labelled.set(field, value);
        scores[field] = 0.95;
        break;
      }
    }
  }

  const whole = lines.join(" ");

  // — Name —
  // The labelled name wins; otherwise the first line that isn't a spec, a
  // stopword, or boilerplate. In practice catalogues put the name first and
  // set it larger, and the block clusterer already preserved reading order.
  let name = labelled.get("name") ?? null;
  if (!name) {
    for (const line of lines) {
      const low = line.toLowerCase();
      if (line.includes(":")) continue;
      if (NAME_STOPWORDS.has(low)) continue;
      if ([...NAME_STOPWORDS].some((w) => low.startsWith(w))) continue;
      if (/^\d+$/.test(line)) continue;
      if (SIZE_RE.test(line)) { SIZE_RE.lastIndex = 0; continue; }
      SIZE_RE.lastIndex = 0;
      if (line.length < 3 || line.length > 70) continue;
      name = line;
      scores.name = 0.6;
      break;
    }
  }
  if (!name) return null;
  name = cleanName(name);
  if (!name || name.length < 3) return null;

  // — Sizes —
  const sizeSource = labelled.get("sizes") ?? whole;
  const sizes: string[] = [];
  let sm: RegExpExecArray | null;
  SIZE_RE.lastIndex = 0;
  while ((sm = SIZE_RE.exec(sizeSource)) !== null) {
    const size = `${sm[1]}x${sm[2]}`;
    if (!sizes.includes(size)) sizes.push(size);
  }
  if (sizes.length && scores.sizes == null) scores.sizes = 0.7;

  // — Thickness —
  let thickness = labelled.get("thickness") ?? null;
  if (!thickness) {
    // Careful: sizes are also in mm. Only look outside the size expressions.
    const withoutSizes = whole.replace(SIZE_RE, " ");
    SIZE_RE.lastIndex = 0;
    const tm = withoutSizes.match(THICKNESS_RE);
    if (tm) {
      thickness = `${tm[1]}mm`;
      scores.thickness = 0.65;
    }
  } else {
    thickness = thickness.replace(/\s+/g, "").toLowerCase();
  }

  // — Product code —
  let productCode = labelled.get("productCode") ?? null;
  if (!productCode) {
    const cm = whole.match(CODE_RE);
    if (cm) {
      productCode = cm[1].replace(/\s+/g, "-").toUpperCase();
      scores.productCode = 0.55;
    }
  } else {
    productCode = productCode.toUpperCase();
  }

  // — Vocabulary fields —
  const finish = labelled.get("finish") ?? matchVocabulary(whole, FINISHES_SORTED);
  if (finish && scores.finish == null) scores.finish = 0.7;

  const material = labelled.get("material") ?? matchVocabulary(whole, MATERIALS_SORTED);
  if (material && scores.material == null) scores.material = 0.7;

  let color = labelled.get("color") ?? matchVocabulary(whole, COLORS_SORTED);
  if (!color) {
    // Catalogues frequently encode the shade in the name — "Dune Taupe".
    color = matchVocabulary(name, COLORS_SORTED);
    if (color) scores.color = 0.5;
  } else if (scores.color == null) {
    scores.color = 0.7;
  }

  const surface = labelled.get("surface") ?? null;

  // — Applications —
  const appSource = labelled.get("applications");
  const { applications, tags } = appSource
    ? normaliseApplications(appSource.split(/[,;|/]+/))
    : normaliseApplications(guessApplications(whole));
  if (applications.length && scores.applications == null) {
    scores.applications = appSource ? 0.9 : 0.4;
  }

  // — Description —
  // Prose lines only: long, unlabelled, and not a spec value.
  const prose = lines.filter(
    (l) => l.length > 60 && !l.includes(":") && l !== name && /[a-z]{4}\s+[a-z]{4}/i.test(l)
  );
  const description = prose.length ? prose.join(" ") : null;

  const collectionName = labelled.get("collection") ?? context.collection ?? null;

  const filled = [
    name, productCode, sizes.length ? "y" : null, finish, thickness, material, color,
    applications.length ? "y" : null,
  ].filter(Boolean).length;

  return {
    name,
    productCode,
    collectionName,
    sizes,
    finish: finish ? titleCase(finish) : null,
    thickness,
    material: material ? titleCase(material) : null,
    color: color ? titleCase(color) : null,
    surface,
    applications,
    applicationTags: tags,
    description,
    rawText: text,
    // Coverage-weighted, nudged by how many fields were explicitly labelled.
    confidence: Math.min(1, (filled / 8) * 0.75 + (Object.keys(labelled).length / 8) * 0.25),
    fieldScores: scores,
  };
}

/** Scan free text for room words when there's no labelled application field. */
function guessApplications(text: string): string[] {
  const found: string[] = [];
  const candidates = [
    "living room", "bedroom", "bathroom", "kitchen", "outdoor", "balcony", "terrace",
    "commercial", "office", "hotel", "villa", "restaurant", "hospital", "wall", "floor",
    "exterior", "facade", "washroom", "parking", "lobby",
  ];
  const low = ` ${text.toLowerCase()} `;
  for (const c of candidates) if (low.includes(` ${c} `)) found.push(c);
  return found;
}

/** Strip catalogue ornamentation from a candidate name. */
function cleanName(raw: string): string {
  return raw
    .replace(/^[^\p{L}\p{N}]+/u, "")
    .replace(/[^\p{L}\p{N})\]]+$/u, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * Stable identity for a product across overlapping page windows and repeat
 * imports. Code is the strongest signal when present, since two collections can
 * both contain a "Statuario".
 */
export function fingerprint(p: {
  brandName?: string | null;
  productCode?: string | null;
  name: string;
}): string {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "");
  const parts = [norm(p.brandName ?? ""), norm(p.productCode ?? ""), norm(p.name)];
  return parts.join(":");
}
