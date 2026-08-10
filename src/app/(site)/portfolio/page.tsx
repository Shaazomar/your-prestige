import type { Metadata } from "next";
import { PortfolioGrid } from "@/components/site/PortfolioGrid";
import { CatalogueHero } from "@/components/site/catalog/CatalogueHero";

export const metadata: Metadata = {
  title: "Projects & Portfolio",
  description:
    "2,400+ projects delivered — villas, apartments, hotels and commercial landmarks across Mangaluru and Dakshina Kannada, finished with Prestige surfaces.",
};

export default function PortfolioPage() {
  return (
    <main className="min-h-screen bg-white">
      <CatalogueHero
        eyebrow="THE PORTFOLIO"
        title={"Landmarks we've had\nthe honour to finish."}
        description="Villas, apartments, hotels and commercial spaces — a selection from 2,400+ delivered projects across coastal Karnataka."
        heroImage="https://images.unsplash.com/photo-1613490493576-7fde63acd811?q=80&w=1600&auto=format&fit=crop"
      />
      <PortfolioGrid />
    </main>
  );
}
