import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  ArrowUpRight, Download, Ruler, Layers, Palette, Fingerprint, MessageCircle,
} from "lucide-react";
import { getCatalogProduct, getRelatedProducts, getCatalogParams } from "@/lib/products";
import { Container } from "@/components/ui/Container";
import { Reveal, RevealStagger, RevealItem } from "@/components/motion/Reveal";
import { Parallax } from "@/components/motion/Parallax";
import { TextReveal } from "@/components/motion/TextReveal";
import { ButtonLink } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SizeChip } from "@/components/site/catalog/SizeChip";
import { ApplicationBadge } from "@/components/site/catalog/ApplicationBadge";
import { BrandMark } from "@/components/site/catalog/BrandMark";
import { RelatedProducts } from "@/components/site/catalog/RelatedProducts";
import { business, siteUrl } from "@/lib/site-config";

export const revalidate = 3600;

/**
 * Pre-renders the most prominent products; the long tail renders on demand and
 * is then cached, since `dynamicParams` defaults to true. Capped so a
 * thousand-product catalogue doesn't turn every build into a full crawl.
 */
export async function generateStaticParams() {
  return getCatalogParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getCatalogProduct(slug);
  if (!product) return {};
  return {
    title: `${product.name} — ${product.collection}`,
    description: `${product.name} by ${product.brand}. ${product.finish}, available in ${product.sizes.join(", ")}. Experience it at Your Prestige, Mangaluru.`,
    openGraph: { images: [product.lifestyleImage] },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getCatalogProduct(slug);
  if (!product) notFound();

  const related = await getRelatedProducts(product);
  const inspirationGallery = [product.lifestyleImage, ...product.gallery];

  const specs = [
    { icon: Ruler, label: "Thickness", value: product.thickness },
    { icon: Layers, label: "Finish", value: product.finish },
    { icon: Palette, label: "Color", value: product.color },
    { icon: Fingerprint, label: "Texture", value: product.texture },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: [product.lifestyleImage, product.textureImage, ...product.gallery],
    brand: { "@type": "Brand", name: product.brand },
    category: product.category,
    url: `${siteUrl}/products/${product.category}/${product.slug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Huge cinematic hero */}
      <section className="relative flex h-[86vh] min-h-[560px] items-end overflow-hidden bg-ink">
        <div className="absolute inset-0">
          <Image
            src={product.lifestyleImage}
            alt={`${product.name} styled in an interior setting`}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/35 to-ink/10" />
        </div>

        <Container size="wide" className="relative z-10 pb-16 md:pb-24">
          <div className="flex flex-wrap items-center gap-3">
            {product.tag && (
              <span className="rounded-full bg-gold px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-ivory">
                {product.tag}
              </span>
            )}
            <BrandMark brand={product.brand} dark />
          </div>
          <Reveal direction="none" duration={0.7}>
            <p className="text-eyebrow mb-3 mt-6 text-gold">{product.collection}</p>
          </Reveal>
          <TextReveal as="h1" text={product.name} className="text-display-lg max-w-4xl text-ivory" />
          <Reveal delay={0.3}>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ivory/65">
              {product.description}
            </p>
          </Reveal>
          <Reveal delay={0.45}>
            <div className="mt-9 flex flex-wrap gap-4">
              <ButtonLink href="/request-quote" variant="gold" size="lg">
                Request a Quote
                <ArrowUpRight className="h-5 w-5" />
              </ButtonLink>
              <ButtonLink href="/book-visit" variant="outline-light" size="lg">
                Visit Showroom
              </ButtonLink>
              <a
                href={`https://wa.me/${business.whatsapp}?text=${encodeURIComponent(
                  `Hi! I'm interested in ${product.name} (${product.collection}).`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Ask on WhatsApp"
                className="flex h-14 w-14 items-center justify-center rounded-full border border-ivory/30 text-ivory transition-all duration-500 hover:border-[#25D366] hover:bg-[#25D366] hover:text-ivory"
              >
                <MessageCircle className="h-5 w-5" />
              </a>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* Specs, sizes, applications */}
      <section className="bg-ivory py-24 md:py-32">
        <Container size="wide">
          <div className="grid gap-16 lg:grid-cols-[1fr_1.1fr] lg:gap-24">
            <div>
              <p className="text-eyebrow mb-8 text-gold">Specifications</p>
              <RevealStagger className="grid grid-cols-2 gap-6" stagger={0.08}>
                {specs.map((s) => (
                  <RevealItem key={s.label}>
                    <div className="rounded-2xl border hairline bg-white p-6 shadow-soft">
                      <s.icon className="mb-3 h-5 w-5 text-gold" />
                      <p className="text-xs uppercase tracking-[0.2em] text-stone-400">
                        {s.label}
                      </p>
                      <p className="mt-1.5 font-medium text-ink">{s.value}</p>
                    </div>
                  </RevealItem>
                ))}
              </RevealStagger>

              <Reveal delay={0.2}>
                <button className="group mt-8 inline-flex items-center gap-3 rounded-full border border-ink/15 px-7 py-4 text-sm font-medium transition-all duration-500 hover:border-ink hover:bg-ink hover:text-ivory">
                  <Download className="h-4 w-4" />
                  Download Specification Sheet
                </button>
              </Reveal>
            </div>

            <div>
              <div>
                <p className="text-eyebrow mb-4 text-gold">Available Sizes</p>
                <div className="flex flex-wrap gap-2.5">
                  {product.sizes.map((size, i) => (
                    <SizeChip key={size} size={size} index={i} />
                  ))}
                </div>
              </div>
              <div className="mt-10">
                <p className="text-eyebrow mb-4 text-gold">Suitable Applications</p>
                <div className="flex flex-wrap gap-2.5">
                  {product.applications.map((app) => (
                    <ApplicationBadge key={app} application={app} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Texture close-up — the material story */}
      <section className="relative overflow-hidden bg-charcoal py-2">
        <Parallax speed={0.1} className="relative h-[70vh] min-h-[420px]">
          <div className="relative h-full w-full">
            <Image
              src={product.textureImage}
              alt={`${product.name} material close-up texture`}
              fill
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-ink/75 via-ink/20 to-transparent" />
          </div>
        </Parallax>
        <Container size="wide" className="pointer-events-none absolute inset-0 z-10 flex items-center">
          <div className="max-w-md">
            <p className="text-eyebrow mb-4 text-gold">The Material</p>
            <p className="serif-accent text-3xl leading-tight text-ivory md:text-4xl">
              Every grain, every vein — engineered to feel found, not made.
            </p>
          </div>
        </Container>
      </section>

      {/* Interior inspiration gallery */}
      <section className="bg-porcelain py-24 md:py-32">
        <Container size="wide">
          <SectionHeading
            eyebrow="Styled &amp; Installed"
            title="Interior inspiration"
            description={`See ${product.name} at home in real architectural settings.`}
            className="mb-16"
          />
          <RevealStagger
            className="columns-1 gap-5 sm:columns-2 lg:columns-3 [&>*]:mb-5"
            stagger={0.08}
          >
            {inspirationGallery.map((src, i) => (
              <RevealItem key={i}>
                <div className="group relative overflow-hidden rounded-2xl">
                  <div className={i % 3 === 1 ? "relative aspect-[3/4]" : "relative aspect-[4/3]"}>
                    <Image
                      src={src}
                      alt={`${product.name} installation view ${i + 1}`}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-[1.4s] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-108"
                    />
                  </div>
                </div>
              </RevealItem>
            ))}
          </RevealStagger>
        </Container>
      </section>

      {/* Bring it home CTA */}
      <section className="bg-ink py-24 text-ivory md:py-32">
        <Container className="text-center">
          <p className="text-eyebrow text-gold">Room Visualization</p>
          <h2 className="text-display-sm mx-auto mt-5 max-w-2xl">
            The photos are beautiful. Standing in front of it is better.
          </h2>
          <p className="mx-auto mt-6 max-w-lg text-ivory/60">
            Bring your floor plan, a photo of your space, or just your imagination —
            our consultants will show you exactly how {product.name} transforms it.
          </p>
          <Reveal delay={0.2}>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <ButtonLink href="/book-visit" variant="gold" size="lg">
                Visit Showroom
                <ArrowUpRight className="h-5 w-5" />
              </ButtonLink>
              <ButtonLink href="/request-quote" variant="outline-light" size="lg">
                Request a Quote
              </ButtonLink>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section className="bg-ivory py-24 md:py-32">
          <Container size="wide">
            <SectionHeading
              eyebrow="Pairs Beautifully With"
              title="You may also love"
              className="mb-14"
            />
            <RelatedProducts products={related} />
          </Container>
        </section>
      )}
    </>
  );
}
