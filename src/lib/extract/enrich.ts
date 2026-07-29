import { toApplications } from "@/lib/applications";

/**
 * Composes the copy and SEO metadata an extracted product needs to be
 * publishable — deterministically, from facts the catalogue actually stated.
 *
 * The rule this file follows: **never write a sentence that isn't backed by an
 * extracted field.** No "timeless elegance" on a row where we only know a size.
 * A shorter true sentence beats a longer invented one, and every output here is
 * editable in review, so this is a strong first draft rather than a final word.
 *
 * Template choice is keyed off a hash of the slug, so a 400-product import
 * doesn't read like the same sentence 400 times — which is both bad copy and,
 * for near-duplicate page content, bad SEO.
 */

export interface EnrichmentInput {
  name: string;
  brandName?: string | null;
  collectionName?: string | null;
  productCode?: string | null;
  sizes?: string[];
  finish?: string | null;
  thickness?: string | null;
  material?: string | null;
  color?: string | null;
  surface?: string | null;
  applications?: unknown;
  applicationTags?: string[];
  description?: string | null;
}

export interface Enrichment {
  slug: string;
  premiumDescription: string;
  seoTitle: string;
  seoDescription: string;
  metaKeywords: string[];
  searchKeywords: string[];
  faqs: { q: string; a: string }[];
  altText: string;
  caption: string;
  imageTitle: string;
}

const SEO_TITLE_MAX = 60;
const SEO_DESC_MAX = 155;

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const formatSize = (s: string) => s.replace(/x/i, " × ") + " mm";

function listOf(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

export function enrich(input: EnrichmentInput): Enrichment {
  const brand = input.brandName?.trim() || null;
  const collection = input.collectionName?.trim() || null;
  const sizes = (input.sizes ?? []).filter(Boolean);
  const applications = toApplications(input.applications);

  const slug = slugify([brand, collection, input.name].filter(Boolean).join(" "));
  const variant = hash(slug);

  // — Description —
  const sentences: string[] = [];

  // Opening: identity. Only names facts we have.
  const surfaceWord = materialPhrase(input.material);
  const finishPhrase = input.finish ? `${input.finish.toLowerCase()} ` : "";
  const colorPhrase = input.color ? ` in ${input.color.toLowerCase()}` : "";

  const openers = [
    brand && collection
      ? `${input.name} joins ${brand}'s ${collection} as a ${finishPhrase}${surfaceWord}${colorPhrase}.`
      : `${input.name} is a ${finishPhrase}${surfaceWord}${colorPhrase}.`,
    brand
      ? `A ${finishPhrase}${surfaceWord}${colorPhrase}, ${input.name} comes to us from ${brand}${collection ? ` as part of the ${collection}` : ""}.`
      : `${input.name} — a ${finishPhrase}${surfaceWord}${colorPhrase}.`,
    collection
      ? `From the ${collection}${brand ? ` by ${brand}` : ""}, ${input.name} presents a ${finishPhrase}${surfaceWord}${colorPhrase}.`
      : `${input.name} presents a ${finishPhrase}${surfaceWord}${colorPhrase}.`,
  ];
  sentences.push(openers[variant % openers.length]);

  // Format.
  if (sizes.length === 1) {
    sentences.push(`It is produced in a single ${formatSize(sizes[0])} format${input.thickness ? ` at ${input.thickness}` : ""}.`);
  } else if (sizes.length > 1) {
    sentences.push(
      `Available in ${listOf(sizes.map(formatSize))}${input.thickness ? `, ${input.thickness} thick` : ""}, it suits both compact rooms and open, uninterrupted spans.`
    );
  }

  // Where it belongs.
  if (applications.length) {
    const spaces = listOf(applications.map((a) => a.toLowerCase()));
    const closers = [
      `Specified for ${spaces}.`,
      `It reads equally well across ${spaces}.`,
      `Recommended for ${spaces}.`,
    ];
    sentences.push(closers[variant % closers.length]);
  }

  // The catalogue's own prose, if it had any, always wins the closing note.
  if (input.description && input.description.length > 40) {
    sentences.push(input.description.trim());
  }

  const premiumDescription = sentences.join(" ").replace(/\s{2,}/g, " ").trim();

  // — SEO —
  const titleBase = [input.name, collection].filter(Boolean).join(" — ");
  const seoTitle = clamp(brand ? `${titleBase} | ${brand}` : titleBase, SEO_TITLE_MAX);

  const descBits = [
    input.finish,
    sizes.length ? sizes.map((s) => s.replace(/x/i, "×")).join(", ") + " mm" : null,
    input.material,
  ].filter(Boolean);
  const seoDescription = clamp(
    `${input.name}${brand ? ` by ${brand}` : ""}${descBits.length ? ` — ${descBits.join(", ")}` : ""}. See it at Prestige Tiles & Sanitary, Mangaluru.`,
    SEO_DESC_MAX
  );

  // — Keywords —
  const searchKeywords = unique(
    [
      input.name, brand, collection, input.finish, input.material, input.color,
      input.surface, input.productCode,
      ...sizes, ...sizes.map((s) => s.replace(/x/i, " x ")),
      ...applications, ...(input.applicationTags ?? []),
    ]
      .filter((v): v is string => typeof v === "string" && v.trim().length > 1)
      .map((v) => v.trim().toLowerCase())
  );

  const metaKeywords = unique([
    ...searchKeywords.slice(0, 10),
    ...(brand ? [`${brand.toLowerCase()} tiles`, `${brand.toLowerCase()} dealer mangaluru`] : []),
    "tiles mangaluru",
  ]).slice(0, 14);

  // — FAQs, only where a real answer exists —
  const faqs: { q: string; a: string }[] = [];
  if (sizes.length) {
    faqs.push({
      q: `What sizes is ${input.name} available in?`,
      a: `${input.name} is available in ${listOf(sizes.map(formatSize))}${input.thickness ? `, at ${input.thickness} thickness` : ""}.`,
    });
  }
  if (applications.length) {
    faqs.push({
      q: `Where can ${input.name} be used?`,
      a: `It is suited to ${listOf(applications.map((a) => a.toLowerCase()))}. Our consultants can confirm suitability for your specific project.`,
    });
  }
  if (input.finish) {
    faqs.push({
      q: `What finish does ${input.name} have?`,
      a: `${input.name} has a ${input.finish.toLowerCase()} finish${input.material ? ` on a ${input.material.toLowerCase()} body` : ""}.`,
    });
  }
  faqs.push({
    q: `Can I see ${input.name} in person?`,
    a: `Yes — ${input.name} can be viewed at our Mangaluru showrooms. Book a visit and we'll have it ready alongside complementary pieces.`,
  });

  // — Image metadata —
  const altBits = [input.name, input.finish, input.material, brand].filter(Boolean).join(" ");
  const altText = `${altBits}${sizes.length ? ` in ${formatSize(sizes[0])}` : ""}`.trim();
  const caption = `${input.name}${collection ? ` from the ${collection}` : ""}${brand ? ` by ${brand}` : ""}`;
  const imageTitle = `${input.name}${brand ? ` — ${brand}` : ""}`;

  return {
    slug,
    premiumDescription,
    seoTitle,
    seoDescription,
    metaKeywords,
    searchKeywords,
    faqs,
    altText,
    caption,
    imageTitle,
  };
}

/**
 * Materials in a catalogue are usually adjectival — "Glazed Vitrified",
 * "Double Charge", "Full Body" — and read as a fragment without a noun after
 * them ("a matt glazed vitrified in taupe"). Ones that already end in a noun
 * are left alone so we don't produce "porcelain slab tile".
 */
const MATERIAL_NOUNS = /\b(slab|tile|tiles|stone|china|steel|mosaic|glass|wood|marble|granite|quartz|quartzite|travertine|onyx|slate|sandstone|concrete|cement|clay|terracotta|brass|acrylic|sanitaryware)$/i;

function materialPhrase(material?: string | null): string {
  const m = material?.trim().toLowerCase();
  if (!m) return "surface";
  return MATERIAL_NOUNS.test(m) ? m : `${m} tile`;
}

/** Trim to length on a word boundary rather than mid-word. */
function clamp(s: string, max: number): string {
  const t = s.replace(/\s{2,}/g, " ").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,–—-]+$/, "");
}

function unique(items: string[]): string[] {
  return [...new Set(items)];
}
