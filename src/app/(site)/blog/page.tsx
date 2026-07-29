import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Container } from "@/components/ui/Container";
import { getBlogPosts } from "@/lib/posts";
import { RevealStagger, RevealItem } from "@/components/motion/Reveal";

export const metadata: Metadata = {
  title: "Journal",
  description:
    "Design intelligence from Your Prestige — tile guides, bathroom design principles and material wisdom for coastal Karnataka.",
};

export const revalidate = 300;

export default async function BlogPage() {
  const blogPosts = await getBlogPosts();

  return (
    <>
      <PageHero
        eyebrow="The Journal"
        title="Material wisdom, beautifully written."
        description="Guides and perspectives from our design consultants — for anyone building something worth keeping."
      />
      <section className="bg-ivory py-20 md:py-28">
        <Container size="wide">
          <RevealStagger className="grid gap-10 md:grid-cols-2 lg:grid-cols-3" stagger={0.12}>
            {blogPosts.map((post) => (
              <RevealItem key={post.slug}>
                <Link href={`/blog/${post.slug}`} className="group block">
                  <div className="relative overflow-hidden rounded-3xl">
                    <div className="relative aspect-[4/3]">
                      <Image
                        src={post.cover}
                        alt={post.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover transition-transform duration-[1.4s] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-107"
                      />
                    </div>
                  </div>
                  <div className="mt-6 px-1">
                    <p className="text-xs uppercase tracking-[0.22em] text-stone-400">
                      {new Date(post.date).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}{" "}
                      · {post.readTime}
                    </p>
                    <h2 className="mt-3 text-2xl font-semibold leading-snug tracking-tight text-ink transition-colors duration-300 group-hover:text-gold">
                      {post.title}
                    </h2>
                    <p className="mt-3 leading-relaxed text-slate-warm">{post.excerpt}</p>
                    <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-gold">
                      Read Article
                      <ArrowUpRight className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-1 group-hover:-translate-y-1" />
                    </span>
                  </div>
                </Link>
              </RevealItem>
            ))}
          </RevealStagger>
        </Container>
      </section>
    </>
  );
}
