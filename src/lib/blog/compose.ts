import { slugify } from "@/lib/extract/enrich";

/**
 * Blog draft composer.
 *
 * An honest description of what this is: it **assembles a structured draft**,
 * not finished prose. Given a topic and some catalogue context it produces the
 * outline, the SEO scaffolding, the internal links and the related products —
 * the mechanical parts a writer would otherwise rebuild by hand every time —
 * and leaves the body copy to a person.
 *
 * It deliberately does not fabricate paragraphs. A blog full of generated
 * filler about "timeless elegance" would actively damage the site's standing:
 * thin content is a ranking liability, and it misrepresents a showroom whose
 * whole pitch is expertise. So each section ships with a prompt describing
 * what to cover, and the draft is saved unpublished.
 */

export interface ComposeInput {
  topic: string;
  /** Optional angle — "for coastal homes", "for architects". */
  angle?: string;
  keywords?: string[];
  /** Products to reference, usually chosen in the admin. */
  products?: { slug: string; name: string; category: string; brand: string; collection: string }[];
  /** Landing pages and other posts worth linking to. */
  internalLinks?: { href: string; label: string }[];
  city?: string;
}

export interface ComposedDraft {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  seoTitle: string;
  seoDescription: string;
  keywords: string[];
  outline: { heading: string; prompt: string }[];
  relatedProductSlugs: string[];
}

const SEO_TITLE_MAX = 60;
const SEO_DESC_MAX = 155;

export function composeDraft(input: ComposeInput): ComposedDraft {
  const topic = input.topic.trim();
  const city = input.city?.trim() || "Mangaluru";
  const angle = input.angle?.trim();

  const title = angle ? `${topic}: ${angle}` : topic;
  const slug = slugify(title);

  /**
   * A standard, defensible structure for a specification-advice piece:
   * context → criteria → the actual decision → practical constraints →
   * where to see it. Each prompt says what belongs in the section.
   */
  const outline: { heading: string; prompt: string }[] = [
    {
      heading: "Why this matters",
      prompt: `Open with the real problem a ${city} customer faces around ${topic.toLowerCase()}. What goes wrong when it's chosen badly? Use a specific example from the showroom floor rather than a generality.`,
    },
    {
      heading: "What to look for",
      prompt: `The two or three technical criteria that actually decide the outcome — the numbers or ratings a buyer should ask about, and what each one means in plain language.`,
    },
    {
      heading: "How it performs on the coast",
      prompt: `Dakshina Kannada specifics: heavy monsoon, salt air, humidity. What holds up here and what doesn't? This is the section a national blog can't write.`,
    },
    {
      heading: "Installation and cost realities",
      prompt: `Substrate preparation, handling, wastage, and where budgets typically get miscalculated. Be honest about what adds cost.`,
    },
    {
      heading: "Seeing it in person",
      prompt: `Close by inviting a showroom visit — say what's actually on display and why the decision is easier at full scale.`,
    },
  ];

  // The body ships as an editable skeleton: real headings, and a visible
  // instruction under each one that must be replaced before publishing.
  const content = outline
    .map((s) => `## ${s.heading}\n\n> TO WRITE: ${s.prompt}\n`)
    .join("\n");

  const keywords = unique([
    ...(input.keywords ?? []),
    topic.toLowerCase(),
    `${topic.toLowerCase()} ${city.toLowerCase()}`,
    `tiles ${city.toLowerCase()}`,
    ...(input.products ?? []).flatMap((p) => [p.brand.toLowerCase(), p.collection.toLowerCase()]),
  ]).filter(Boolean);

  const excerpt = angle
    ? `${topic} — ${angle.toLowerCase()}. Practical guidance from our ${city} showrooms.`
    : `A practical guide to ${topic.toLowerCase()}, from the team at our ${city} showrooms.`;

  return {
    title,
    slug,
    excerpt,
    content,
    seoTitle: fitTitle(topic, angle, city),
    seoDescription: clamp(excerpt, SEO_DESC_MAX),
    keywords: keywords.slice(0, 14),
    outline,
    relatedProductSlugs: (input.products ?? []).map((p) => p.slug),
  };
}

/** Markdown link block appended to a draft, so internal linking isn't forgotten. */
export function linkSection(
  products: ComposeInput["products"] = [],
  links: ComposeInput["internalLinks"] = []
): string {
  const lines: string[] = [];
  if (products.length) {
    lines.push("## Pieces mentioned\n");
    for (const p of products) {
      lines.push(`- [${p.name} — ${p.brand}](/products/${p.category}/${p.slug})`);
    }
    lines.push("");
  }
  if (links.length) {
    lines.push("## Related reading\n");
    for (const l of links) lines.push(`- [${l.label}](${l.href})`);
    lines.push("");
  }
  return lines.join("\n");
}

/**
 * Fit a title into the SERP limit by shedding parts, not by truncating.
 *
 * Cutting a long title mid-phrase produces "…what actually matters on the",
 * which reads like a bug in the search result. Dropping the angle, and then
 * the location suffix, keeps every version a complete thought.
 */
function fitTitle(topic: string, angle: string | undefined, city: string): string {
  const candidates = [
    angle ? `${topic}: ${angle} | Prestige ${city}` : `${topic} | Prestige ${city}`,
    `${topic} | Prestige ${city}`,
    `${topic} | Prestige`,
    topic,
  ];
  return candidates.find((c) => c.length <= SEO_TITLE_MAX) ?? clamp(topic, SEO_TITLE_MAX);
}

function clamp(s: string, max: number): string {
  const t = s.replace(/\s{2,}/g, " ").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const i = cut.lastIndexOf(" ");
  return (i > max * 0.6 ? cut.slice(0, i) : cut).replace(/[\s,–—-]+$/, "");
}

const unique = (a: string[]) => [...new Set(a.map((s) => s.trim()).filter(Boolean))];
