import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { getBlogPost, getBlogPosts, getRelatedPosts } from "@/lib/posts";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/motion/Reveal";
import { TextReveal } from "@/components/motion/TextReveal";
import { ReadingProgress } from "@/components/site/ReadingProgress";
import { ButtonLink } from "@/components/ui/Button";
import { siteUrl } from "@/lib/site-config";

export const revalidate = 300;

export async function generateStaticParams() {
  const posts = await getBlogPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: { title: post.title, description: post.excerpt, images: [post.cover] },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) notFound();

  const related = await getRelatedPosts(slug);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    image: post.cover,
    datePublished: post.date,
    author: { "@type": "Organization", name: "Your Prestige" },
    mainEntityOfPage: `${siteUrl}/blog/${post.slug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ReadingProgress />

      {/* Article hero */}
      <article>
        <header className="bg-ink pb-16 pt-40 text-ivory md:pb-24 md:pt-52">
          <Container size="narrow">
            <Reveal direction="none">
              <p className="text-eyebrow mb-6 text-gold">
                {new Date(post.date).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}{" "}
                · {post.readTime}
              </p>
            </Reveal>
            <TextReveal as="h1" text={post.title} className="text-display-sm" />
          </Container>
        </header>

        <Reveal>
          <div className="relative -mb-24 mx-auto max-w-5xl -translate-y-12 px-6">
            <div className="relative aspect-[16/9] overflow-hidden rounded-3xl shadow-float">
              <Image
                src={post.cover}
                alt={post.title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 1024px"
                className="object-cover"
              />
            </div>
          </div>
        </Reveal>

        {/* Body with table of contents */}
        <div className="bg-ivory pb-24 pt-36 md:pb-32">
          <Container>
            <div className="grid gap-14 lg:grid-cols-[220px_1fr]">
              <aside className="hidden lg:block">
                <nav className="sticky top-32" aria-label="Table of contents">
                  <p className="text-eyebrow mb-5 text-stone-400">Contents</p>
                  <ol className="space-y-3 border-l hairline pl-5">
                    {post.sections.map((s, i) => (
                      <li key={i}>
                        <a
                          href={`#section-${i}`}
                          className="text-sm text-slate-warm transition-colors hover:text-gold"
                        >
                          {s.heading}
                        </a>
                      </li>
                    ))}
                  </ol>
                </nav>
              </aside>

              <div className="max-w-2xl">
                <Reveal>
                  <p className="serif-accent text-2xl leading-relaxed text-slate-warm">
                    {post.excerpt}
                  </p>
                </Reveal>
                {post.sections.map((s, i) => (
                  <Reveal key={i} delay={0.05}>
                    <section id={`section-${i}`} className="mt-12 scroll-mt-32">
                      <h2 className="text-2xl font-semibold tracking-tight text-ink md:text-3xl">
                        {s.heading}
                      </h2>
                      <p className="mt-5 text-lg leading-[1.85] text-slate-warm">{s.body}</p>
                    </section>
                  </Reveal>
                ))}

                <Reveal>
                  <div className="mt-16 rounded-3xl bg-ink p-10 text-ivory">
                    <p className="text-eyebrow mb-3 text-gold">Put this into practice</p>
                    <p className="text-xl font-medium leading-relaxed">
                      See every surface from this article, full-scale, in our Mangaluru
                      showroom.
                    </p>
                    <div className="mt-6">
                      <ButtonLink href="/book-visit" variant="gold" size="md">
                        Book a Visit
                        <ArrowUpRight className="h-4 w-4" />
                      </ButtonLink>
                    </div>
                  </div>
                </Reveal>
              </div>
            </div>
          </Container>
        </div>
      </article>

      {/* Related */}
      <section className="border-t hairline bg-porcelain py-20 md:py-24">
        <Container size="wide">
          <p className="text-eyebrow mb-10 text-gold">Continue Reading</p>
          <div className="grid gap-8 md:grid-cols-2">
            {related.map((p) => (
              <Link key={p.slug} href={`/blog/${p.slug}`} className="group flex gap-6">
                <div className="relative h-28 w-40 shrink-0 overflow-hidden rounded-2xl">
                  <Image
                    src={p.cover}
                    alt={p.title}
                    fill
                    sizes="160px"
                    className="object-cover transition-transform duration-700 group-hover:scale-108"
                  />
                </div>
                <div>
                  <h3 className="font-semibold leading-snug text-ink transition-colors group-hover:text-gold">
                    {p.title}
                  </h3>
                  <p className="mt-2 text-sm text-stone-400">{p.readTime}</p>
                </div>
              </Link>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
