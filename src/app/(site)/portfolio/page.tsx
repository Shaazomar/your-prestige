import type { Metadata } from "next";
import { PageHero } from "@/components/site/PageHero";
import { PortfolioGrid } from "@/components/site/PortfolioGrid";

export const metadata: Metadata = {
  title: "Portfolio",
  description:
    "2,400+ projects delivered — villas, apartments, hotels and commercial landmarks across Mangaluru and Dakshina Kannada, finished with Prestige surfaces.",
};

export default function PortfolioPage() {
  return (
    <>
      <PageHero
        eyebrow="The Portfolio"
        title="Landmarks we've had the honour to finish."
        description="Villas, apartments, hotels and commercial spaces — a selection from 2,400+ delivered projects."
      />
      <PortfolioGrid />
    </>
  );
}
