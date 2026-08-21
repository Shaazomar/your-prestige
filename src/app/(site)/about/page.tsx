import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { PageHero } from "@/components/site/PageHero";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/motion/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Stats } from "@/components/site/home/Stats";
import { ButtonLink } from "@/components/ui/Button";
import { ArrowUpRight } from "lucide-react";
import { PeopleSection } from "@/components/site/about/PeopleSection";
import { seedInitialInauguration } from "@/app/admin/(dashboard)/content/about-people/actions";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Fifteen years of shaping coastal Karnataka's finest spaces. Discover the story behind Your Prestige — Mangaluru's destination for luxury tiles and sanitaryware.",
};

export default async function AboutPage() {
  // Ensure seed is initialized and updated
  await seedInitialInauguration();

  const people = await prisma.aboutPerson.findMany({
    where: { active: true, deletedAt: null },
    orderBy: [
      { displayOrder: "asc" },
      { createdAt: "asc" },
    ],
  });

  return (
    <>
      <PageHero
        eyebrow="The Prestige Story"
        title="Fifteen years of shaping beautiful spaces."
        description="From a single storefront to coastal Karnataka's most trusted destination for luxury surfaces — this is how we built Your Prestige."
      />

      {/* Dynamic People & Guests Section */}
      <PeopleSection
        people={people}
        title="Distinguished Guests"
        eyebrow="PEOPLE WHO HAVE BEEN PART OF OUR JOURNEY"
      />

      <Stats />

      {/* CTA */}
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
    </>
  );
}
