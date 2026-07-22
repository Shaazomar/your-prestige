import type { Metadata } from "next";
import { MapPin, Phone, Mail, Clock, Navigation } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Container } from "@/components/ui/Container";
import { LeadForm } from "@/components/site/LeadForm";
import { Reveal } from "@/components/motion/Reveal";
import { business } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Visit Your Prestige at Kodialbail, Mangaluru. Call, WhatsApp or write to us — our design consultants respond within working hours.",
};

const contactCards = [
  {
    icon: MapPin,
    title: "Showroom",
    lines: [
      `${business.address.street}, ${business.address.locality}`,
      `${business.address.city} — ${business.address.postalCode}`,
    ],
  },
  {
    icon: Phone,
    title: "Call / WhatsApp",
    lines: [business.phone, "Response within working hours"],
  },
  {
    icon: Mail,
    title: "Write to Us",
    lines: [business.email, "Trade enquiries welcome"],
  },
  {
    icon: Clock,
    title: "Hours",
    lines: [`Mon–Sat: ${business.hours.weekdays}`, `Sun: ${business.hours.sunday}`],
  },
] as const;

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Let's talk about your space."
        description="Call, write, or walk in — the coffee is always on."
      />

      <section className="bg-ivory py-20 md:py-28">
        <Container size="wide">
          <div className="grid gap-14 lg:grid-cols-2 lg:gap-20">
            {/* Info + map */}
            <div>
              <Reveal>
                <div className="grid gap-5 sm:grid-cols-2">
                  {contactCards.map((c) => (
                    <div
                      key={c.title}
                      className="rounded-3xl border hairline bg-white p-7 shadow-soft"
                    >
                      <c.icon className="mb-4 h-5 w-5 text-gold" />
                      <p className="font-semibold text-ink">{c.title}</p>
                      {c.lines.map((l) => (
                        <p key={l} className="mt-1 text-sm text-slate-warm">
                          {l}
                        </p>
                      ))}
                    </div>
                  ))}
                </div>
              </Reveal>

              <Reveal delay={0.15}>
                <div className="relative mt-6 overflow-hidden rounded-3xl border hairline shadow-soft">
                  <iframe
                    title="Your Prestige showroom location"
                    src={`https://maps.google.com/maps?q=${business.geo.lat},${business.geo.lng}&z=15&output=embed`}
                    className="h-80 w-full grayscale-[0.4] contrast-[1.05]"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                  <a
                    href={business.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="glass absolute bottom-5 left-5 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-ink shadow-soft transition-transform hover:scale-105"
                  >
                    <Navigation className="h-4 w-4 text-gold" />
                    Get Directions
                  </a>
                </div>
              </Reveal>
            </div>

            {/* Form */}
            <Reveal delay={0.2}>
              <div className="rounded-3xl border hairline bg-white p-8 shadow-soft md:p-12">
                <h2 className="text-2xl font-semibold tracking-tight text-ink">
                  Send an enquiry
                </h2>
                <p className="mb-8 mt-2 text-slate-warm">
                  Tell us a little about your project — we&apos;ll take it from there.
                </p>
                <LeadForm type="CONTACT" />
              </div>
            </Reveal>
          </div>
        </Container>
      </section>
    </>
  );
}
