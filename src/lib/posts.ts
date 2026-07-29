import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { blogPosts as fallbackPosts, type BlogPost } from "@/lib/blog-content";
import type { Post } from "@prisma/client";

/**
 * Public blog, read from the CMS.
 *
 * Same shape as the existing `BlogPost` so the blog pages don't change, and
 * the same fallback discipline as the catalogue: an empty or unreachable
 * database renders the bundled posts rather than an empty page.
 *
 * The one real translation is `content` (markdown, one column) into
 * `sections` (heading + body pairs, which is what the templates render).
 * Splitting on H2s preserves the existing layout without needing a markdown
 * renderer or a schema change.
 */

const WORDS_PER_MINUTE = 210;
const FALLBACK_COVER = "/brand/og-image.png";

export function toBlogPost(row: Post): BlogPost {
  const content = row.content ?? "";
  return {
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt ?? firstParagraph(content),
    cover: row.coverImage || FALLBACK_COVER,
    date: (row.publishedAt ?? row.createdAt).toISOString(),
    readTime: `${Math.max(1, Math.round(wordCount(content) / WORDS_PER_MINUTE))} min read`,
    sections: parseSections(content),
  };
}

/**
 * Markdown → sections.
 *
 * Text before the first H2 becomes an untitled opening section, so a post
 * written as plain prose still renders correctly rather than disappearing.
 */
export function parseSections(markdown: string): { heading: string; body: string }[] {
  const text = markdown.replace(/\r\n/g, "\n").trim();
  if (!text) return [];

  const parts = text.split(/^##\s+(.+)$/m);
  const sections: { heading: string; body: string }[] = [];

  const preamble = parts[0]?.trim();
  if (preamble) sections.push({ heading: "", body: clean(preamble) });

  for (let i = 1; i < parts.length; i += 2) {
    const heading = parts[i]?.trim() ?? "";
    const body = clean(parts[i + 1] ?? "");
    if (heading || body) sections.push({ heading, body });
  }

  return sections.length ? sections : [{ heading: "", body: clean(text) }];
}

/** Strip the markdown the templates don't render, keeping the prose intact. */
function clean(s: string): string {
  return s
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/\[(.+?)\]\(.+?\)/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function firstParagraph(markdown: string): string {
  const p = clean(markdown).split(/\n\n/)[0] ?? "";
  return p.length > 200 ? `${p.slice(0, 197).trimEnd()}…` : p;
}

const wordCount = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

export const getBlogPosts = cache(async (): Promise<BlogPost[]> => {
  try {
    const rows = await prisma.post.findMany({
      where: { published: true, deletedAt: null },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: 200,
    });
    if (rows.length === 0) return fallbackPosts;
    return rows.map(toBlogPost);
  } catch {
    return fallbackPosts;
  }
});

export const getBlogPost = cache(async (slug: string): Promise<BlogPost | null> => {
  try {
    const row = await prisma.post.findFirst({
      where: { slug, published: true, deletedAt: null },
    });
    if (row) return toBlogPost(row);
  } catch {
    // fall through
  }
  return fallbackPosts.find((p) => p.slug === slug) ?? null;
});

export const getRelatedPosts = cache(
  async (slug: string, count = 2): Promise<BlogPost[]> => {
    const all = await getBlogPosts();
    return all.filter((p) => p.slug !== slug).slice(0, count);
  }
);
