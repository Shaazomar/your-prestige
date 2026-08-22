import React from "react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { RevealStagger, RevealItem } from "@/components/motion/Reveal";
import { TiltedCard } from "@/components/ui/TiltedCard";
import type { AboutPerson } from "@prisma/client";

interface PeopleSectionProps {
  people: AboutPerson[];
  title?: string;
  eyebrow?: string;
}

export function PeopleSection({
  people,
  title = "People Behind the Journey",
  eyebrow = "LEADERSHIP & DISTINGUISHED GUESTS",
}: PeopleSectionProps) {
  // Exclude inauguration record & inactive people
  const activePeople = people.filter(
    (p) =>
      p.active &&
      p.type !== "INAUGURATION" &&
      p.eyebrow !== "INAUGURATED BY" &&
      p.name !== "U. T. Khader"
  );

  // If no additional active people exist, hide section completely
  if (activePeople.length === 0) return null;

  return (
    <section className="bg-white py-24 md:py-36 border-b border-stone-200/70 relative overflow-hidden">
      <Container size="wide">
        <SectionHeading
          eyebrow={eyebrow}
          title={title}
          align="center"
          className="mb-16"
        />

        <RevealStagger
          className="grid gap-8 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          stagger={0.1}
        >
          {activePeople.map((person) => (
            <RevealItem key={person.id}>
              <div className="flex flex-col items-center w-full">
                <TiltedCard
                  imageSrc={person.image}
                  altText={
                    person.imageAlt || `${person.name} - ${person.designation}`
                  }
                  containerHeight="420px"
                  containerWidth="100%"
                  imageHeight="380px"
                  imageWidth="100%"
                  rotateAmplitude={8}
                  scaleOnHover={1.04}
                  showMobileWarning={false}
                  showTooltip={false}
                  displayOverlayContent={true}
                  overlayContent={
                    <div className="space-y-1 text-left w-full">
                      <h3 className="text-2xl font-serif font-bold text-white tracking-tight drop-shadow-md">
                        {person.name}
                      </h3>
                      <p className="text-sm font-medium text-amber-200/90 leading-snug drop-shadow-sm">
                        {person.designation}
                      </p>
                      {person.description && (
                        <p className="mt-1 line-clamp-2 text-xs text-white/80 leading-relaxed">
                          {person.description}
                        </p>
                      )}
                    </div>
                  }
                />
              </div>
            </RevealItem>
          ))}
        </RevealStagger>
      </Container>
    </section>
  );
}
