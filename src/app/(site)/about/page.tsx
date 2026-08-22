import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { PageHero } from "@/components/site/PageHero";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/motion/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Stats } from "@/components/site/home/Stats";
import { ButtonLink } from "@/components/ui/Button";
import { ArrowUpRight } from "lucide-react";
import { InaugurationSection } from "@/components/site/about/InaugurationSection";
import { PeopleSection } from "@/components/site/about/PeopleSection";
import { seedInitialInauguration } from "@/app/admin/(dashboard)/content/about-people/actions";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Fifteen years of shaping coastal Karnataka's finest spaces. Discover the story behind Your Prestige — Mangaluru's destination for luxury tiles and sanitaryware.",
};

export default async function AboutPage() {
  // Ensure default Inauguration record exists
  await seedInitialInauguration();

  const allPeople = await prisma.aboutPerson.findMany({
    where: { active: true, deletedAt: null },
    orderBy: [
      { displayOrder: "asc" },
      { createdAt: "asc" },
    ],
  });

  const inauguration =
    allPeople.find(
      (p) =>
        p.type === "INAUGURATION" ||
        p.eyebrow === "INAUGURATED BY" ||
        p.name === "U. T. Khader"
    ) || null;

  return (
    <main className="min-h-screen bg-white">
      <PageHero
        eyebrow="The Prestige Story"
        title="Fifteen years of shaping beautiful spaces."
        description="From a single storefront to coastal Karnataka's most trusted destination for luxury surfaces — this is how we built Your Prestige."
      />

      {/* 1. MAIN HIGHLIGHT: Inauguration Section */}
      <InaugurationSection inauguration={inauguration} />

      {/* 2. SECONDARY SECTION: Additional People & Leadership (TiltedCard Grid) */}
      <PeopleSection people={allPeople} />

      {/* 3. Company Stats */}
      <Stats />

      {/* 4. CTA */}
      <section className="bg-porcelain py-24 md:py-32">
        <Container className="text-center">
          <SectionHeading
            eyebrow="Experience it yourself"
            title="The showroom tells the story better than we can"
            align="center"
          />
          <Reveal delay={0.3}>
            <div className="mt-10 flex justify-center">
              <ButtonLink href="/book-visit" variant="primary" size="lg">
                Book a Private Visit
                <ArrowUpRight className="h-5 w-5" />
              </ButtonLink>
            </div>
          </Reveal>
        </Container>
      </section>
    </main>
  );
}
