import type { Metadata } from "next";
import { SectionCategory, sectionCategoryMetadata } from "@/components/site/catalog/SectionPages";

const SECTION = "bathware";

export const revalidate = 600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  return sectionCategoryMetadata(SECTION, category);
}

export default async function BathwareCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ category }, sp] = await Promise.all([params, searchParams]);
  return <SectionCategory sectionSlug={SECTION} categorySlug={category} searchParams={sp} />;
}
