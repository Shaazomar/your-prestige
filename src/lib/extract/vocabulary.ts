/**
 * Controlled vocabularies for tile and sanitaryware catalogues.
 *
 * Extraction is deterministic — there's no model inferring that "Carving" is a
 * finish — so the vocabulary *is* the intelligence. These lists come from the
 * terms Indian and European tile brands actually print (Somany, Kajaria, RAK,
 * Simpolo, Jaquar et al). Adding a term here immediately improves every
 * subsequent import, which is the intended way to tune the extractor.
 */

export const FINISHES = [
  "matt", "matte", "glossy", "high gloss", "gloss", "polished", "semi polished", "super polished",
  "satin", "silk", "rustic", "carving", "sugar", "lappato", "honed", "textured", "structured",
  "natural", "anti skid", "anti-skid", "grip", "metallic", "glazed", "unglazed", "endless",
  "soft matt", "velvet", "leather", "brushed", "bookmatch", "book match", "book-match",
  "chrome", "brushed nickel", "matte black", "rose gold", "antique brass", "gun metal",
] as const;

export const MATERIALS = [
  "glazed vitrified", "polished glazed vitrified", "double charge", "full body", "vitrified",
  "porcelain", "ceramic", "glazed ceramic", "marble", "granite", "quartz", "quartzite",
  "terracotta", "clay", "cement", "concrete", "sandstone", "travertine", "onyx", "slate",
  "porcelain slab", "sintered stone", "mosaic", "glass", "wood", "engineered stone",
  "brass", "stainless steel", "ceramic sanitaryware", "vitreous china", "acrylic",
] as const;

export const COLORS = [
  "white", "ivory", "beige", "cream", "sand", "taupe", "grey", "gray", "light grey", "dark grey",
  "charcoal", "black", "brown", "walnut", "oak", "teak", "wenge", "rust", "terracotta", "red",
  "maroon", "pink", "blush", "gold", "bronze", "copper", "silver", "chrome", "blue", "navy",
  "aqua", "teal", "green", "olive", "sage", "emerald", "yellow", "mustard", "orange",
  "statuario", "carrara", "calacatta", "nero", "bianco", "beige marfil", "onyx", "multicolor",
] as const;

/** Words that reliably introduce a labelled field in a spec block. */
export const FIELD_LABELS: Record<string, string[]> = {
  name: ["product name", "design name", "name", "design", "article name"],
  productCode: ["product code", "design code", "article code", "article no", "art no", "code", "sku", "item code", "model", "model no"],
  sizes: ["size", "sizes", "dimension", "dimensions", "format", "nominal size", "available size", "available sizes"],
  finish: ["finish", "surface finish", "surface"],
  thickness: ["thickness", "thk"],
  material: ["material", "body", "type", "product type", "category"],
  color: ["colour", "color", "shade", "tone", "base colour", "base color"],
  applications: ["application", "applications", "suitable for", "usage", "use", "recommended for", "area of application", "space"],
  collection: ["collection", "series", "range", "concept"],
};

/** Lines that are never a product name, however they're positioned. */
export const NAME_STOPWORDS = new Set([
  "index", "contents", "table of contents", "introduction", "about us", "our story",
  "technical specification", "technical specifications", "specifications", "packing details",
  "packaging", "laying pattern", "installation", "disclaimer", "terms and conditions",
  "note", "notes", "legend", "certification", "certifications", "quality", "warranty",
  "thank you", "get in touch", "contact us", "head office", "corporate office", "showroom",
  "www", "email", "phone", "tel", "page",
]);

/** Longest first, so "polished glazed vitrified" wins over "vitrified". */
const byLengthDesc = (a: string, b: string) => b.length - a.length;

export const FINISHES_SORTED = [...FINISHES].sort(byLengthDesc);
export const MATERIALS_SORTED = [...MATERIALS].sort(byLengthDesc);
export const COLORS_SORTED = [...COLORS].sort(byLengthDesc);

/** Case-insensitive whole-phrase match. */
export function matchVocabulary(text: string, vocabulary: readonly string[]): string | null {
  const haystack = ` ${text.toLowerCase().replace(/\s+/g, " ")} `;
  for (const term of vocabulary) {
    if (haystack.includes(` ${term} `) || haystack.includes(` ${term},`) || haystack.includes(` ${term}.`)) {
      return titleCase(term);
    }
  }
  return null;
}

export function titleCase(s: string): string {
  return s.replace(/\b[a-z]/g, (c) => c.toUpperCase());
}
