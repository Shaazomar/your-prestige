import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/site/PageHero";


const collectionsList = [
  {
    title: "Lumina Marble Collection",
    subtitle: "Italian Statuario & Carrara Porcelain Slabs",
    description: "Luminous white fields with soft charcoal vein lines. Book-matched laying option creates continuous vein flows across large salon floors.",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1600&auto=format&fit=crop",
    link: "/products?collection=Lumina+Marble+Collection",
    itemCount: "14 Slabs",
    finishes: "Polished & Honed",
  },
  {
    title: "Volcanica Basalt Series",
    subtitle: "Honed Volcanic Surface vitrified tiles",
    description: "Deep charcoal matte basalt engineered with tactile volcanic micro-structure. Slip-resistant enough for verandahs, refined enough for boardroom lobbies.",
    image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=1600&auto=format&fit=crop",
    link: "/products?collection=Volcanica+Collection",
    itemCount: "8 Formats",
    finishes: "Matte & Structured R11",
  },
  {
    title: "Antico Stone Series",
    subtitle: "Fossilised Tuscan Travertine Porcelain",
    description: "Sun-warmed travertine with natural fossilised pitting. Engineered for warmth and consistency across coastal villas.",
    image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?q=80&w=1600&auto=format&fit=crop",
    link: "/products?collection=Antico+Stone+Collection",
    itemCount: "12 Formats",
    finishes: "Honed Vitrified",
  },
  {
    title: "Sanctuary Bath Series",
    subtitle: "Sculptural Soaking Tubs & Sanitaryware",
    description: "Minimalist bath silhouettes and PVD brushed gold wellness rain systems designed to elevate daily ritual into spa indulgence.",
    image: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?q=80&w=1600&auto=format&fit=crop",
    link: "/products?category=sanitary",
    itemCount: "18 Pieces",
    finishes: "Alpine White & Gold PVD",
  },
  {
    title: "Exterra Outdoor Series",
    subtitle: "20mm Heavy-Duty Architectural Pavers",
    description: "Monolithic 20mm porcelain slabs built for poolside decks, open driveways, and high-footfall public plazas.",
    image: "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?q=80&w=1600&auto=format&fit=crop",
    link: "/products?collection=Exterra+Outdoor+Collection",
    itemCount: "10 Formats",
    finishes: "Structured Anti-Slip",
  },
  {
    title: "Culina Surface Series",
    subtitle: "Ultra-Compact Countertop Slabs",
    description: "12mm stain-proof quartz surfaces engineered to wrap waterfall kitchen islands without visible seams.",
    image: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=1600&auto=format&fit=crop",
    link: "/products?collection=Culina+Surface+Collection",
    itemCount: "9 Slabs",
    finishes: "Ultra-Polish & Satin",
  },
];

export const metadata = {
  title: "Architectural Collections | Prestige Tiles",
  description: "Curated collections of luxury porcelain slabs, Italian marble reproductions, travertine, and wellness sanitaryware.",
};

export default function CollectionsPage() {
  return (
    <main className="min-h-screen bg-white">
      <PageHero
        eyebrow="Curated Design Families"
        title="Architectural Collections"
        description="Explore our master collections, grouped by material origin, tactile finish, and design philosophy."
      />

      <section className="py-20 md:py-28">
        <Container size="wide">
          <div className="space-y-16">
            {collectionsList.map((col, index) => (
              <div
                key={col.title}
                className={`grid grid-cols-1 lg:grid-cols-12 gap-10 items-center ${
                  index % 2 === 1 ? "lg:flex-row-reverse" : ""
                }`}
              >
                <div
                  className={`relative h-[420px] rounded-2xl overflow-hidden shadow-float border border-stone-200 lg:col-span-7 ${
                    index % 2 === 1 ? "lg:order-2" : ""
                  }`}
                >
                  <Image
                    src={col.image}
                    alt={col.title}
                    fill
                    className="object-cover transition-transform duration-700 hover:scale-105"
                  />
                  <div className="absolute top-4 left-4 flex gap-2">
                    <span className="rounded-full bg-black/60 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-accent backdrop-blur-md border border-white/10">
                      {col.itemCount}
                    </span>
                    <span className="rounded-full bg-white/90 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-ink backdrop-blur-md">
                      {col.finishes}
                    </span>
                  </div>
                </div>

                <div className={`lg:col-span-5 ${index % 2 === 1 ? "lg:order-1" : ""}`}>
                  <span className="text-eyebrow text-accent block mb-2 font-bold flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" /> Prestige Collection
                  </span>
                  <h2 className="text-heading text-ink mb-2">{col.title}</h2>
                  <p className="text-subheading text-slate-warm mb-4 font-semibold">{col.subtitle}</p>
                  <p className="text-body-lg text-slate-warm leading-relaxed mb-8">{col.description}</p>
                  <Link
                    href={col.link}
                    className="inline-flex items-center gap-2 rounded-xl bg-ink px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-accent hover:text-ink transition-colors shadow-soft"
                  >
                    View Products In Collection <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>
    </main>
  );
}
