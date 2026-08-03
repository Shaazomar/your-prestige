import type { Metadata } from "next";
import Link from "next/link";
import { Phone, Clock, Navigation, Store, MessageCircle, ArrowUpRight } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Container } from "@/components/ui/Container";
import { LeadForm } from "@/components/site/LeadForm";
import { Reveal } from "@/components/motion/Reveal";
import { getBusiness, telHref, waHref } from "@/lib/business";
import { getShowrooms, formatAddress, directionsHref } from "@/lib/showrooms";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Call, WhatsApp or write to Prestige Tiles & Sanitary — or walk into any of our five showrooms across Mangaluru, Puttur and Moodbidri.",
};

export default async function ContactPage() {
  const [business, showrooms] = await Promise.all([getBusiness(), getShowrooms()]);
  const flagship = showrooms.find((s) => s.isFlagship) ?? showrooms[0];

  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Let's talk about your space."
        description="Call, write, or walk into whichever showroom is closest — the coffee is always on."
      />

      <section className="bg-ivory py-20 md:py-28">
        <Container size="wide">
          <div className="grid gap-14 lg:grid-cols-2 lg:gap-20">
            {/* Contact essentials + showroom directory */}
            <div>
              <Reveal>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="rounded-3xl border hairline bg-white p-7 shadow-soft">
                    <Phone className="mb-4 h-5 w-5 text-gold" />
                    <p className="font-semibold text-ink">Call or WhatsApp</p>
                    <a
                      href={telHref(business.phone)}
                      className="mt-1 block text-sm text-slate-warm hover:text-gold"
                    >
                      {business.phone}
                    </a>
                    <a
                      href={waHref(business.whatsapp, "Hi Prestige! I'd like to enquire.")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-[#25D366]"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      Message on WhatsApp
                    </a>
                  </div>
                  <div className="rounded-3xl border hairline bg-white p-7 shadow-soft">
                    <Clock className="mb-4 h-5 w-5 text-gold" />
                    <p className="font-semibold text-ink">Hours</p>
                    <p className="mt-1 text-sm text-slate-warm">{business.hoursWeekdays}</p>
                    <p className="mt-1 text-xs leading-relaxed text-stone-400">
                      {business.hoursSunday}
                    </p>
                  </div>
                </div>
              </Reveal>

              {/* All showrooms */}
              <Reveal delay={0.15}>
                <div className="mt-6 overflow-hidden rounded-3xl border hairline bg-white shadow-soft">
                  <p className="flex items-center gap-2 border-b hairline px-7 py-5 text-sm font-semibold text-ink">
                    <Store className="h-4 w-4 text-gold" />
                    Our {showrooms.length} Showrooms
                  </p>
                  <ul className="divide-y hairline">
                    {showrooms.map((s) => (
                      <li key={s.slug} className="px-7 py-5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <Link
                              href={`/showrooms/${s.slug}`}
                              className="font-medium text-ink transition-colors hover:text-gold"
                            >
                              {s.locality ?? s.city}
                              {s.isFlagship && (
                                <span className="ml-2 rounded-full bg-gold/10 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wider text-gold-deep">
                                  Flagship
                                </span>
                              )}
                            </Link>
                            <p className="mt-0.5 text-xs text-stone-400">{s.name}</p>
                            <p className="mt-1.5 text-sm leading-relaxed text-slate-warm">
                              {formatAddress(s)}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-1.5">
                            <a
                              href={telHref(s.phone)}
                              aria-label={`Call ${s.name}`}
                              className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/12 text-ink transition-colors hover:bg-ink hover:text-ivory"
                            >
                              <Phone className="h-3.5 w-3.5" />
                            </a>
                            <a
                              href={directionsHref(s)}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`Directions to ${s.name}`}
                              className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/12 text-ink transition-colors hover:bg-ink hover:text-ivory"
                            >
                              <Navigation className="h-3.5 w-3.5" />
                            </a>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/showrooms"
                    className="flex items-center justify-center gap-1.5 border-t hairline bg-porcelain py-4 text-sm font-medium text-ink transition-colors hover:text-gold"
                  >
                    Explore all showrooms
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
              </Reveal>

              {/* Flagship map */}
              {flagship && (
                <Reveal delay={0.2}>
                  <div className="relative mt-6 overflow-hidden rounded-3xl border hairline shadow-soft">
                    <iframe
                      title={`Map — ${flagship.name}`}
                      src={
                        flagship.mapEmbedUrl ??
                        (flagship.latitude != null && flagship.longitude != null
                          ? `https://maps.google.com/maps?q=${flagship.latitude},${flagship.longitude}&z=15&output=embed`
                          : `https://maps.google.com/maps?q=${encodeURIComponent(formatAddress(flagship))}&z=15&output=embed`)
                      }
                      className="h-72 w-full grayscale-[0.4] contrast-[1.05]"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                    <a
                      href={directionsHref(flagship)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="glass-light absolute bottom-5 left-5 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-ink shadow-soft transition-transform hover:scale-105"
                    >
                      <Navigation className="h-4 w-4 text-gold" />
                      Directions to {flagship.locality ?? flagship.city}
                    </a>
                  </div>
                </Reveal>
              )}
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
                <LeadForm
                  type="CONTACT"
                  showrooms={showrooms.map((s) => ({
                    slug: s.slug,
                    name: s.name,
                    locality: s.locality,
                    city: s.city,
                  }))}
                />
              </div>
            </Reveal>
          </div>
        </Container>
      </section>
    </>
  );
}
