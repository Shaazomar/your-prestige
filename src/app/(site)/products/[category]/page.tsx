import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/site/PageHero";
import { Container } from "@/components/ui/Container";
import { ProductCard } from "@/components/site/ProductCard";
import { products } from "@/lib/demo-content";
import { RevealStagger, RevealItem } from "@/components/motion/Reveal";

const categories = {
  tiles: {
    title: "Premium Tiles",
    eyebrow: "Tiles Collection",
    description:
      "Italian marble slabs, large-format porcelain and artisan ceramics — engineered surfaces with the soul of natural stone.",
  },
  sanitary: {
    title: "Luxury Sanitaryware",
    eyebrow: "Sanitary Collection",
    description:
      "Sanctuary bathrooms from the world's finest houses — faucets, wellness systems, freestanding tubs and sculptural basins.",
  },
  "designer-picks": {
    title: "Designer Picks",
    eyebrow: "Curated Monthly",
    description:
      "Hand-selected statements chosen by our design consultants — the pieces we'd put in our own homes.",
  },
} as const;

type CategoryKey = keyof typeof categories;

export function generateStaticParams() {
  return Object.keys(categories).map((category) => ({ category }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const cat = categories[category as CategoryKey];
  if (!cat) return {};
  return { title: cat.title, description: cat.description };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const cat = categories[category as CategoryKey];
  if (!cat) notFound();

  const items =
    category === "designer-picks"
      ? products.filter((p) => p.tag === "Designer Pick" || p.tag === "Premium")
      : products.filter((p) => p.category === category);

  return (
    <>
      <PageHero eyebrow={cat.eyebrow} title={cat.title} description={cat.description} />
      <section className="bg-ivory py-24 md:py-32">
        <Container size="wide">
          <RevealStagger
            className="grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3"
            stagger={0.1}
          >
            {(items.length ? items : products).map((p) => (
              <RevealItem key={p.slug}>
                <ProductCard product={p} />
              </RevealItem>
            ))}
          </RevealStagger>
        </Container>
      </section>
    </>
  );
}
