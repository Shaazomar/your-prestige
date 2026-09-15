import type { Metadata } from "next";
import { SectionLanding, sectionMetadata } from "@/components/site/catalog/SectionPages";

const SECTION = "bathware";

export const revalidate = 600;

export function generateMetadata(): Promise<Metadata> {
  return sectionMetadata(SECTION, "Bathware");
}

export default function BathwarePage() {
  return <SectionLanding sectionSlug={SECTION} eyebrow="Bath & Wellness" />;
}
