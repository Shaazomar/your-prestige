import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/site/PageHero";
import { applicationsData } from "@/lib/applications";
import { products, Application } from "@/lib/catalog";
import { ProductCard } from "@/components/site/catalog/ProductCard";



interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return applicationsData.map((app) => ({ slug: app.slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const app = applicationsData.find((a) => a.slug === slug);
  if (!app) return {};
  return {
    title: `${app.title} Surfaces & Slabs | Prestige Tiles`,
    description: app.description,
  };
}

export default async function ApplicationDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const app = applicationsData.find((a) => a.slug === slug);

  if (!app) {
    notFound();
  }

  // Filter matching products by application title
  const matchingProducts = products.filter((p) =>
    p.applications.some(
      (item: Application) => item.toLowerCase().replace(/\s+/g, "-") === slug || item.toLowerCase().includes(slug)
    )
  );

  const displayProducts = matchingProducts.length > 0 ? matchingProducts : products.slice(0, 4);

  return (
    <main className="min-h-screen bg-white">
      <PageHero
        eyebrow="Architectural Application"
        title={app.title}
        description={app.description}
      />

      <section className="py-16 md:py-24">
        <Container size="wide">
          <div className="mb-8 flex items-center justify-between">
            <Link
              href="/applications"
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-warm hover:text-ink transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Back to All Applications
            </Link>
            <span className="text-xs font-bold text-accent uppercase tracking-wider">
              {displayProducts.length} Compatible Products
            </span>
          </div>

          {/* Grid of matching tiles */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayProducts.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>
        </Container>
      </section>

      {/* CTA Band */}
      <section className="bg-offwhite py-20 border-t border-stone-200">
        <Container size="wide" className="text-center max-w-2xl mx-auto space-y-6">
          <span className="text-eyebrow text-accent font-bold block">Need Technical Specification?</span>
          <h2 className="text-heading text-ink">Custom Spec Sheets for {app.title}</h2>
          <p className="text-body-lg text-slate-warm">
            Our architectural desk can provide slip-resistance certificates, CAD files, and bulk square footage pricing.
          </p>
          <div className="pt-4">
            <Link
              href="/request-quote"
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-8 py-4 text-xs font-bold uppercase tracking-wider text-ink hover:bg-accent-hover transition-colors shadow-yellow"
            >
              Request {app.title} Quote <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </Container>
      </section>
    </main>
  );
}
