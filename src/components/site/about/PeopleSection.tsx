import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { RevealStagger, RevealItem } from "@/components/motion/Reveal";
import type { AboutPerson } from "@prisma/client";

interface PeopleSectionProps {
  people: AboutPerson[];
  title?: string;
  eyebrow?: string;
}

export function PeopleSection({
  people,
  title = "Distinguished Guests",
  eyebrow = "PEOPLE WHO HAVE BEEN PART OF OUR JOURNEY",
}: PeopleSectionProps) {
  const activePeople = people.filter((p) => p.active);
  if (activePeople.length === 0) return null;

  return (
    <section className="bg-ivory py-24 md:py-36 border-b border-gold/15 relative overflow-hidden">
      {/* Premium background decorative blur */}
      <div className="pointer-events-none absolute -right-40 top-1/3 h-96 w-96 rounded-full bg-gold/5 blur-3xl" />
      <div className="pointer-events-none absolute -left-40 bottom-1/3 h-96 w-96 rounded-full bg-slate-warm/5 blur-3xl" />

      <Container size="wide">
        <SectionHeading
          eyebrow={eyebrow}
          title={title}
          align="center"
          className="mb-20"
        />

        <RevealStagger className="grid gap-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" stagger={0.1}>
          {activePeople.map((person) => (
            <RevealItem key={person.id}>
              <div className="group relative flex flex-col bg-transparent transition-all duration-500 hover:-translate-y-2">
                {/* Image portrait with premium asymmetric/curved corners */}
                <div className="relative aspect-[3/4] w-full overflow-hidden rounded-[2.5rem] rounded-tr-[5rem] rounded-bl-[5rem] bg-porcelain transition-transform duration-700 shadow-md group-hover:shadow-xl group-hover:shadow-gold/5">
                  <Image
                    src={person.image}
                    alt={person.imageAlt || `${person.name} - ${person.designation}`}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105"
                    loading="lazy"
                    unoptimized={person.image.startsWith("/uploads")}
                  />
                  {/* Premium overlay shadow gradient on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                </div>

                {/* Content with generous whitespace & premium typography */}
                <div className="mt-6 space-y-2 px-2">
                  <h3 className="text-2xl font-serif font-bold text-ink transition-colors duration-300 group-hover:text-gold tracking-tight">
                    {person.name}
                  </h3>

                  <p className="text-sm font-medium text-slate-warm/95 leading-relaxed">
                    {person.designation}
                  </p>
                </div>
              </div>
            </RevealItem>
          ))}
        </RevealStagger>
      </Container>
    </section>
  );
}
