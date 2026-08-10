import type { Metadata } from "next";
import { PageHero } from "@/components/site/PageHero";
import { Container } from "@/components/ui/Container";
import { FaqAccordion } from "@/components/site/FaqAccordion";
import { getPublishedFaqs } from "@/lib/faqs";
import { Reveal } from "@/components/motion/Reveal";
import { ButtonLink } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "FAQs",
  description:
    "Answers to common questions about visiting, brands, delivery, trade pricing and installation at Your Prestige, Mangaluru.",
};

export default async function FaqsPage() {
  const faqs = await getPublishedFaqs();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PageHero
        eyebrow="Questions, Answered"
        title="Everything you'd like to know."
      />
      <section className="bg-ivory py-20 md:py-28">
        <Container>
          <Reveal>
            <FaqAccordion items={faqs} />
          </Reveal>
          <Reveal delay={0.2}>
            <div className="mt-12 flex flex-col items-center gap-5 text-center">
              <p className="text-slate-warm">Still curious? We love questions.</p>
              <ButtonLink href="/contact" variant="outline" size="lg">
                Talk to Us
              </ButtonLink>
            </div>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
