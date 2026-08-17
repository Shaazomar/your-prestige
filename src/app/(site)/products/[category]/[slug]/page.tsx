import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Download, Ruler, Layers, Palette, Fingerprint, Rotate3D, Box,
} from "lucide-react";
import { getCatalogProduct, getRelatedProducts, getCatalogParams } from "@/lib/products";
import { Container } from "@/components/ui/Container";
import { Parallax } from "@/components/motion/Parallax";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SizeChip } from "@/components/site/catalog/SizeChip";
import { ApplicationBadge } from "@/components/site/catalog/ApplicationBadge";
import { BrandMark } from "@/components/site/catalog/BrandMark";
import { RelatedProducts } from "@/components/site/catalog/RelatedProducts";
import { RecentlyViewed } from "@/components/site/catalog/RecentlyViewed";
import { StickyProductCta } from "@/components/site/catalog/StickyProductCta";
import { ProductWhatsAppActions } from "@/components/site/catalog/ProductWhatsAppActions";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { applySeo, getSeoForPath, productJsonLd } from "@/lib/seo";
import { getBusiness } from "@/lib/business";
import { ButtonLink } from "@/components/ui/Button";
import { buildWhatsAppLink } from "@/lib/whatsapp";


export const revalidate = 3600;

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

  const path = `/products/${product.category}/${product.slug}`;
  const base: Metadata = {
    title: `${product.name} — ${product.collection} | Prestige Tiles`,
    description: `${product.name} by ${product.brand}. ${product.finish}, available in ${product.sizes.join(", ")}. Experience it at Prestige Tiles.`,
  };

  return applySeo(base, await getSeoForPath(path), path);
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getCatalogProduct(slug);
  if (!product) notFound();

  const biz = await getBusiness();

  const related = await getRelatedProducts(product);
  const inspirationGallery = [product.lifestyleImage, ...product.gallery];

  const categoryLabel =
    product.category === "sanitary"
      ? "Sanitaryware"
      : product.category === "designer-picks"
        ? "Designer Picks"
        : "Tiles";

  const specs = [
    { icon: Ruler, label: "Slab Thickness", value: product.thickness },
    { icon: Layers, label: "Surface Finish", value: product.finish },
    { icon: Palette, label: "Color Tone", value: product.color },
    { icon: Fingerprint, label: "Texture Grain", value: product.texture },
  ];

  const packingDetails = [
    { label: "Pieces per Box", value: "2 Pcs" },
    { label: "Coverage per Box", value: "15.5 Sq.Ft (1.44 Sq.M)" },
    { label: "Average Box Weight", value: "31.5 Kg" },
    { label: "Water Absorption", value: "< 0.05% (Vitrified)" },
  ];

  const jsonLd = productJsonLd({
    name: product.name,
    slug: product.slug,
    category: product.category,
    description: product.description,
    brand: product.brand,
    images: [product.lifestyleImage, product.textureImage, ...product.gallery],
    color: product.color,
    material: product.texture,
    sizes: product.sizes,
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Cinematic Hero */}
      <section className="relative flex h-[86vh] min-h-[580px] items-end overflow-hidden bg-charcoal text-white">
        <div className="absolute inset-0">
          <Image
            src={product.lifestyleImage}
            alt={`${product.name} styled in an interior setting`}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/20" />
        </div>

        <Container size="wide" className="relative z-10 pb-16 md:pb-24">
          <Breadcrumbs
            dark
            items={[
              { label: "Products", href: "/products" },
              { label: categoryLabel, href: `/products/${product.category}` },
              { label: product.name },
            ]}
          />
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {product.tag && (
              <span className="rounded-full bg-accent px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-ink shadow-yellow">
                {product.tag}
              </span>
            )}
            <span className="rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-md flex items-center gap-1.5 border border-white/20">
              <Rotate3D className="h-3.5 w-3.5 text-accent" /> 360° Studio View Ready
            </span>
            <BrandMark brand={product.brand} dark />
          </div>

          <p className="text-eyebrow mt-6 text-accent font-bold">{product.collection}</p>
          <h1 className="text-hero max-w-4xl text-white font-bold leading-tight mt-1">{product.name}</h1>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-stone-300">
            {product.description}
          </p>

          <div className="mt-8">
            <ProductWhatsAppActions product={product} whatsappNumber={biz.whatsapp} />
          </div>
        </Container>
      </section>

      {/* Technical Specifications & Packing Grid */}
      <section className="bg-white py-24 md:py-32 border-b border-stone-200">
        <Container size="wide">
          <div className="grid gap-16 lg:grid-cols-[1fr_1.1fr] lg:gap-24">
            <div>
              <span className="text-eyebrow text-accent block mb-3 font-bold">Technical Precision</span>
              <h2 className="text-heading text-ink mb-8">Architectural Specifications</h2>

              <div className="grid grid-cols-2 gap-6">
                {specs.map((s) => (
                  <div key={s.label} className="rounded-2xl border border-stone-200 bg-offwhite p-6 shadow-soft hover:border-accent transition-colors">
                    <s.icon className="mb-3 h-6 w-6 text-accent" />
                    <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                      {s.label}
                    </p>
                    <p className="mt-1 font-bold text-ink text-base">{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Packing specs box */}
              <div className="mt-8 rounded-2xl border border-stone-200 bg-white p-6 shadow-soft">
                <div className="flex items-center gap-2 mb-4">
                  <Box className="h-5 w-5 text-accent" />
                  <h4 className="text-sm font-bold text-ink">Packaging & Logistics Standards</h4>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  {packingDetails.map((item) => (
                    <div key={item.label} className="border-b border-stone-100 pb-2">
                      <span className="text-stone-400 block">{item.label}</span>
                      <span className="font-bold text-ink">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Link
                href="/catalogue"
                className="group mt-8 inline-flex items-center gap-3 rounded-xl bg-ink px-8 py-4 text-xs font-bold uppercase tracking-wider text-white hover:bg-accent hover:text-ink transition-colors shadow-soft"
              >
                <Download className="h-4 w-4 text-accent group-hover:text-ink" />
                Download PDF Specification Sheet
              </Link>
            </div>

            <div>
              <div>
                <span className="text-eyebrow text-accent block mb-3 font-bold">Dimensional Scale</span>
                <h3 className="text-subheading text-ink mb-4 font-bold">Available Sizing Formats</h3>
                <div className="flex flex-wrap gap-3">
                  {product.sizes.map((size, i) => (
                    <SizeChip key={size} size={size} index={i} />
                  ))}
                </div>
              </div>

              <div className="mt-12">
                <span className="text-eyebrow text-accent block mb-3 font-bold">Application Environments</span>
                <h3 className="text-subheading text-ink mb-4 font-bold">Tested Application Suitability</h3>
                <div className="flex flex-wrap gap-2.5">
                  {product.applications.map((app) => (
                    <ApplicationBadge key={app} application={app} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Availability is deliberately NOT published here. Depot quantities
              (physical, blocked, confirmed, in-transit, damaged) are internal
              and never reach a public surface — stock is confirmed personally
              over WhatsApp or at the showroom instead. */}
          <div className="mt-16 rounded-3xl border border-stone-200 bg-stone-50/70 p-6 sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-gold">
                  Availability
                </span>
                <h3 className="font-serif text-xl font-bold text-ink">
                  Check current availability with our team
                </h3>
                <p className="mt-1.5 max-w-md text-sm text-stone-500">
                  Stock moves quickly across our depot and showrooms. Message us for
                  live availability, lead times and pricing on this surface.
                </p>
              </div>
              <ButtonLink
                href={buildWhatsAppLink(
                  biz.whatsapp || "",
                  `Hello Prestige Tiles,\n\nI'd like to check availability for:\n*${product.name}* (${product.brand})\n\nCould you share current stock and pricing?`
                )}
                external
                variant="primary"
                size="lg"
                withArrow
                className="shrink-0"
              >
                Enquire on WhatsApp
              </ButtonLink>
            </div>
          </div>
        </Container>
      </section>

      {/* Texture Macro Parallax */}
      <section className="relative overflow-hidden bg-charcoal py-2 text-white">
        <Parallax speed={0.1} className="relative h-[65vh] min-h-[400px]">
          <div className="relative h-full w-full">
            <Image
              src={product.textureImage}
              alt={`${product.name} material close-up texture`}
              fill
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-transparent" />
          </div>
        </Parallax>
        <Container size="wide" className="pointer-events-none absolute inset-0 z-10 flex items-center">
          <div className="max-w-lg">
            <span className="text-eyebrow text-accent block mb-2 font-bold">Tactile Surface Depth</span>
            <p className="serif-accent text-3xl leading-tight text-white md:text-4xl">
              Authentic Italian vein pattern reproduction — crafted to feel quarried from nature.
            </p>
          </div>
        </Container>
      </section>

      {/* Installation Gallery */}
      <section className="bg-offwhite py-24 md:py-32 border-b border-stone-200">
        <Container size="wide">
          <SectionHeading
            eyebrow="Architectural Installations"
            title="Gallery & Lifestyle Scenes"
            description={`Explore how ${product.name} elevates living rooms, luxury hotels, and commercial spaces.`}
            className="mb-16"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {inspirationGallery.map((src, i) => (
              <div key={i} className="group relative h-80 overflow-hidden rounded-2xl border border-stone-200 shadow-soft">
                <Image
                  src={src}
                  alt={`${product.name} view ${i + 1}`}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Related Products */}
      {related.length > 0 && (
        <section className="bg-white py-24 md:py-32">
          <Container size="wide">
            <SectionHeading
              eyebrow="Complementary Finishes"
              title="Pairs Beautifully With"
              className="mb-14"
            />
            <RelatedProducts products={related} />
          </Container>
        </section>
      )}

      <RecentlyViewed currentSlug={product.slug} currentName={product.name} />

      <StickyProductCta
        name={product.name}
        brand={product.brand}
        whatsappNumber={biz.whatsapp || ""}
      />
    </>
  );
}

