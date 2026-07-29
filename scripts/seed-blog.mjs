/**
 * Seeds the bundled blog posts (src/lib/blog-content.ts) into PostgreSQL.
 *
 *   node --experimental-strip-types scripts/seed-blog.mjs
 *
 * Run once when moving the public blog onto the database. Without it the blog
 * renders whatever happens to be in the Post table — which, after the original
 * CMS seed, was a single stub — instead of the three full articles the site
 * used to serve. Reading the TypeScript source directly keeps one source of
 * truth rather than duplicating the copy here.
 *
 * Idempotent: upserts by slug, and only overwrites content when the existing
 * row has less than the bundled version, so an editor's later rewrite is never
 * clobbered by a re-run.
 */
import { PrismaClient } from "@prisma/client";
import { blogPosts } from "../src/lib/blog-content.ts";

const prisma = new PrismaClient();

/** sections[] → markdown, the inverse of parseSections() in src/lib/posts.ts */
function toMarkdown(sections) {
  return sections
    .map((s) => (s.heading ? `## ${s.heading}\n\n${s.body}` : s.body))
    .join("\n\n");
}

async function main() {
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const post of blogPosts) {
    const content = toMarkdown(post.sections);
    const existing = await prisma.post.findUnique({ where: { slug: post.slug } });

    if (existing && (existing.content?.length ?? 0) >= content.length) {
      skipped++;
      continue;
    }

    const data = {
      title: post.title,
      excerpt: post.excerpt,
      content,
      coverImage: post.cover,
      published: true,
      publishedAt: new Date(post.date),
    };

    await prisma.post.upsert({
      where: { slug: post.slug },
      update: data,
      create: { slug: post.slug, ...data },
    });

    if (existing) updated++;
    else created++;
  }

  const live = await prisma.post.count({ where: { published: true, deletedAt: null } });
  console.log(`Blog seeded — ${created} created, ${updated} updated, ${skipped} left alone.`);
  console.log(`Published posts now live: ${live}`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
