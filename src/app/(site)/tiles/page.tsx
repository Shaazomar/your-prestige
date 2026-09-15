import type { Metadata } from "next";
import { SectionLanding, sectionMetadata } from "@/components/site/catalog/SectionPages";

const SECTION = "tiles";

export const revalidate = 600;

export function generateMetadata(): Promise<Metadata> {
  return sectionMetadata(SECTION, "Tiles");
}

export default function TilesPage() {
  return <SectionLanding sectionSlug={SECTION} eyebrow="Surfaces" />;
}
