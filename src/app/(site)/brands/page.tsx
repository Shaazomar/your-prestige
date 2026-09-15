import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Container } from "@/components/ui/Container";
import { RevealStagger, RevealItem } from "@/components/motion/Reveal";
import { SafeImage } from "@/components/ui/SafeImage";
import { Breadcrumbs } from "@/components/site/catalog/Breadcrumbs";
import { getBrandDirectory } from "@/lib/catalog-taxonomy";
import { absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Brands",
  description:
    "Browse the full Prestige catalogue by brand — sanitaryware, faucets, showers, wellness and surfaces from every house we are authorised to supply.",
  alternates: { canonical: absoluteUrl("/brands") },
};

export const revalidate = 600;

export default async function BrandsPage() {
  const brands = await getBrandDirectory();
  const totalProducts = brands.reduce((sum, b) => sum + b.productCount, 0);

  return (
    <>
      <PageHero
        eyebrow="The Houses We Carry"
        title="Browse by brand."
        description={
          brands.length > 0
            ? `${totalProducts.toLocaleString("en-IN")} products across ${brands.length} brands — each with its own ranges, collections and finishes.`
            : "Our brand catalogue is being prepared."
        }
      />

      <section className="bg-ivory pb-24 pt-10 md:pb-32">
        <Container size="wide">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Brands" }]} className="mb-10" />

          {brands.length === 0 ? (
            <p className="py-24 text-center text-ink/45">
              No brands have published products yet.
            </p>
          ) : (
            <RevealStagger
              className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
              stagger={0.05}
            >
              {brands.map((brand) => (
                <RevealItem key={brand.slug}>
                  <Link
                    href={`/brands/${brand.slug}`}
                    className="group flex h-full flex-col overflow-hidden rounded-2xl border hairline bg-canvas transition-all duration-500 hover:-translate-y-0.5 hover:border-gold/40 hover:shadow-[0_18px_50px_-30px_rgba(24,24,24,0.45)]"
                  >
                    {/* Logo plate — a wash rather than a photo, so a brand with
                        no logo still reads as a designed card. */}
                    <div className="relative flex h-36 items-center justify-center overflow-hidden bg-gradient-to-br from-[#f4f2ec] to-[#e9e6dd] px-8">
                      {brand.logo ? (
                        <SafeImage
                          src={brand.logo}
                          alt={brand.name}
                          width={200}
                          height={80}
                          placeholderLabel={brand.name}
                          className="max-h-16 w-auto object-contain"
                        />
                      ) : (
                        <span className="text-center text-2xl font-semibold tracking-tight text-ink/70">
                          {brand.name}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-1 flex-col p-6">
                      <div className="flex items-start justify-between gap-3">
                        <h2 className="text-lg font-medium tracking-tight text-ink">{brand.name}</h2>
                        <span className="shrink-0 rounded-full bg-ink/[0.05] px-2.5 py-1 text-[0.7rem] font-medium tabular-nums text-ink/55">
                          {brand.productCount.toLocaleString("en-IN")}
                        </span>
                      </div>

                      {brand.description && (
                        <p className="mt-2 line-clamp-2 text-[0.85rem] leading-relaxed text-ink/50">
                          {brand.description}
                        </p>
                      )}

                      <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-[0.8rem] font-medium text-ink/70 transition-colors duration-300 group-hover:text-gold">
                        Explore {brand.name}
                        <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </span>
                    </div>
                  </Link>
                </RevealItem>
              ))}
            </RevealStagger>
          )}
        </Container>
      </section>
    </>
  );
}
