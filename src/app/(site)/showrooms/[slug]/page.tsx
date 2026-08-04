import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  MapPin, Phone, Navigation, Clock, ArrowUpRight, User, Car, Check, Store,
  MessageCircle, CalendarCheck2, ChevronLeft,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Container } from "@/components/ui/Container";
import { GoogleReviews } from "@/components/site/showrooms/GoogleReviews";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal, RevealStagger, RevealItem } from "@/components/motion/Reveal";
import { TextReveal } from "@/components/motion/TextReveal";
import { ButtonLink } from "@/components/ui/Button";
import { ShowroomJsonLd } from "@/components/site/JsonLd";
import { getShowrooms, getShowroomBySlug, formatAddress, directionsHref } from "@/lib/showrooms";
import { telHref, waHref } from "@/lib/business";
import { siteUrl } from "@/lib/site-config";

export const revalidate = 300;

export async function generateStaticParams() {
  const showrooms = await getShowrooms();
  return showrooms.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const s = await getShowroomBySlug(slug);
  if (!s) return {};

  const title = `${s.name} — ${s.locality ?? s.city}`;
  const description =
    s.description ??
    `Visit ${s.name} at ${formatAddress(s)}. ${s.hoursWeekdays}. Call ${s.phone} or get directions.`;

  return {
    title,
    description,
    alternates: { canonical: `/showrooms/${s.slug}` },
    openGraph: {
      title,
      description,
      url: `${siteUrl}/showrooms/${s.slug}`,
      ...(s.heroImage ? { images: [s.heroImage] } : {}),
    },
  };
}

export default async function ShowroomDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const s = await getShowroomBySlug(slug);
  if (!s) notFound();

  const featuredProducts = s.featuredProductIds.length
    ? await prisma.product.findMany({
        where: { id: { in: s.featuredProductIds }, published: true, deletedAt: null },
        select: { slug: true, name: true, collection: true, lifestyleImage: true, category: { select: { slug: true } } },
      })
    : [];

  const [allShowrooms, dbRow] = await Promise.all([
    getShowrooms(),
    prisma.showroom.findFirst({ where: { slug: s.slug } }),
  ]);
  const featured = featuredProducts;



  const others = allShowrooms.filter((x) => x.slug !== s.slug);
  const waMessage = `Hi! I'd like to enquire about the ${s.locality ?? s.city} showroom.`;

  return (
    <>
      {dbRow && <ShowroomJsonLd showroom={dbRow} />}

      {/* Hero — video if provided, else hero image */}
      <section className="relative flex h-[80vh] min-h-[540px] items-end overflow-hidden bg-ink">
        <div className="absolute inset-0">
          {s.video ? (
            <video
              autoPlay
              muted
              loop
              playsInline
              poster={s.heroImage ?? undefined}
              className="h-full w-full object-cover"
            >
              <source src={s.video} type="video/mp4" />
            </video>
          ) : s.heroImage ? (
            <Image
              src={s.heroImage}
              alt={`${s.name} showroom interior`}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          ) : (
            <div className="h-full w-full bg-charcoal" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-ink/20" />
        </div>

        <Container size="wide" className="relative z-10 pb-16 md:pb-20">
          <Link
            href="/showrooms"
            className="mb-8 inline-flex items-center gap-1.5 text-sm text-ivory/60 transition-colors hover:text-gold"
          >
            <ChevronLeft className="h-4 w-4" />
            All showrooms
          </Link>
          <Reveal direction="none" duration={0.7}>
            <p className="text-eyebrow mb-4 text-gold">
              {s.locality ? `${s.locality} · ${s.city}` : s.city}
              {s.isFlagship && " · Flagship"}
            </p>
          </Reveal>
          <TextReveal as="h1" text={s.name} className="text-display-lg max-w-4xl text-ivory" />
          {s.subtitle && (
            <Reveal delay={0.25}>
              <p className="mt-4 text-lg text-ivory/70">{s.subtitle}</p>
            </Reveal>
          )}
          <Reveal delay={0.4}>
            <div className="mt-9 flex flex-wrap gap-3">
              <ButtonLink href={directionsHref(s)} external variant="primary" size="lg">
                <Navigation className="h-4.5 w-4.5" />
                Get Directions
              </ButtonLink>
              <ButtonLink href={`/book-visit?showroom=${s.slug}`} variant="outline" size="lg">
                <CalendarCheck2 className="h-4.5 w-4.5" />
                Book a Visit
              </ButtonLink>
              <a
                href={telHref(s.phone)}
                aria-label={`Call ${s.name}`}
                className="flex h-14 w-14 items-center justify-center rounded-full border border-ivory/30 text-ivory transition-all duration-500 hover:bg-ivory hover:text-ink"
              >
                <Phone className="h-5 w-5" />
              </a>
              {s.whatsapp && (
                <a
                  href={waHref(s.whatsapp, waMessage)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`WhatsApp ${s.name}`}
                  className="flex h-14 w-14 items-center justify-center rounded-full border border-ivory/30 text-ivory transition-all duration-500 hover:border-[#25D366] hover:bg-[#25D366]"
                >
                  <MessageCircle className="h-5 w-5" />
                </a>
              )}
            </div>
          </Reveal>
        </Container>
      </section>

      {/* Essentials */}
      <section className="bg-ivory py-20 md:py-28">
        <Container size="wide">
          <div className="grid gap-12 lg:grid-cols-[1.15fr_1fr] lg:gap-20">
            <div>
              {s.description && (
                <Reveal>
                  <p className="text-lg leading-relaxed text-slate-warm">{s.description}</p>
                </Reveal>
              )}

              <RevealStagger className="mt-10 grid gap-5 sm:grid-cols-2" stagger={0.08}>
                <RevealItem>
                  <div className="rounded-2xl border hairline bg-white p-6 shadow-soft">
                    <MapPin className="mb-3 h-5 w-5 text-gold" />
                    <p className="text-xs uppercase tracking-[0.2em] text-stone-400">Address</p>
                    <p className="mt-1.5 leading-relaxed text-ink">{formatAddress(s)}</p>
                  </div>
                </RevealItem>
                <RevealItem>
                  <div className="rounded-2xl border hairline bg-white p-6 shadow-soft">
                    <Clock className="mb-3 h-5 w-5 text-gold" />
                    <p className="text-xs uppercase tracking-[0.2em] text-stone-400">Hours</p>
                    <p className="mt-1.5 text-ink">{s.hoursWeekdays}</p>
                    <p className="text-slate-warm">{s.hoursSunday}</p>
                  </div>
                </RevealItem>
                <RevealItem>
                  <div className="rounded-2xl border hairline bg-white p-6 shadow-soft">
                    <Phone className="mb-3 h-5 w-5 text-gold" />
                    <p className="text-xs uppercase tracking-[0.2em] text-stone-400">Contact</p>
                    <a href={telHref(s.phone)} className="mt-1.5 block font-medium text-ink hover:text-gold">
                      {s.phone}
                    </a>
                    {s.email && (
                      <a href={`mailto:${s.email}`} className="text-sm text-slate-warm hover:text-gold">
                        {s.email}
                      </a>
                    )}
                  </div>
                </RevealItem>
                {(s.managerName || s.managerPhone) && (
                  <RevealItem>
                    <div className="rounded-2xl border hairline bg-white p-6 shadow-soft">
                      <User className="mb-3 h-5 w-5 text-gold" />
                      <p className="text-xs uppercase tracking-[0.2em] text-stone-400">Showroom Manager</p>
                      {s.managerName && <p className="mt-1.5 font-medium text-ink">{s.managerName}</p>}
                      {s.managerPhone && (
                        <a href={telHref(s.managerPhone)} className="text-sm text-slate-warm hover:text-gold">
                          {s.managerPhone}
                        </a>
                      )}
                    </div>
                  </RevealItem>
                )}
              </RevealStagger>

              {s.directions && (
                <Reveal delay={0.2}>
                  <div className="mt-6 flex gap-4 rounded-2xl bg-porcelain p-6">
                    <Car className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-stone-400">
                        Finding us &amp; parking
                      </p>
                      <p className="mt-1.5 leading-relaxed text-slate-warm">{s.directions}</p>
                    </div>
                  </div>
                </Reveal>
              )}

              {s.amenities.length > 0 && (
                <Reveal delay={0.25}>
                  <div className="mt-8">
                    <p className="text-eyebrow mb-4 text-gold">At this showroom</p>
                    <div className="flex flex-wrap gap-2">
                      {s.amenities.map((a) => (
                        <span
                          key={a}
                          className="inline-flex items-center gap-1.5 rounded-full border hairline bg-white px-4 py-2 text-sm text-slate-warm shadow-soft"
                        >
                          <Check className="h-3.5 w-3.5 text-gold" />
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                </Reveal>
              )}
            </div>

            {/* Map */}
            <Reveal delay={0.15}>
              <div className="overflow-hidden rounded-3xl border hairline shadow-soft">
                <iframe
                  title={`Map — ${s.name}`}
                  src={
                    s.mapEmbedUrl ??
                    (s.latitude != null && s.longitude != null
                      ? `https://maps.google.com/maps?q=${s.latitude},${s.longitude}&z=15&output=embed`
                      : `https://maps.google.com/maps?q=${encodeURIComponent(formatAddress(s))}&z=15&output=embed`)
                  }
                  className="h-[420px] w-full grayscale-[0.35] contrast-[1.05] lg:h-[560px]"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
                <a
                  href={directionsHref(s)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-ink py-4 text-sm font-medium text-ivory transition-colors hover:bg-graphite"
                >
                  <Navigation className="h-4 w-4 text-gold" />
                  Open in Google Maps
                </a>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* Brands */}
      {s.brands.length > 0 && (
        <section className="border-y hairline bg-porcelain py-16 md:py-20">
          <Container size="wide">
            <p className="text-eyebrow mb-8 text-center text-stone-400">Brands available here</p>
            <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-5">
              {s.brands.map((b) => (
                <span
                  key={b}
                  className="text-xl font-semibold tracking-tight text-stone-300 transition-colors duration-500 hover:text-ink md:text-2xl"
                >
                  {b}
                </span>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* Gallery */}
      {s.gallery.length > 0 && (
        <section className="bg-ivory py-24 md:py-32">
          <Container size="wide">
            <SectionHeading
              eyebrow="Inside the showroom"
              title="A look around"
              description={`Real photography from our ${s.locality ?? s.city} floor.`}
              className="mb-14"
            />
            <RevealStagger className="columns-1 gap-5 sm:columns-2 lg:columns-3 [&>*]:mb-5" stagger={0.06}>
              {s.gallery.map((src, i) => (
                <RevealItem key={src}>
                  <div className="group relative overflow-hidden rounded-2xl">
                    <div className={i % 3 === 1 ? "relative aspect-[3/4]" : "relative aspect-[4/3]"}>
                      <Image
                        src={src}
                        alt={`${s.name} showroom view ${i + 1}`}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-[1.4s] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-108"
                      />
                    </div>
                  </div>
                </RevealItem>
              ))}
            </RevealStagger>
          </Container>
        </section>
      )}

      {/* Featured products */}
      {featured.length > 0 && (
        <section className="border-t hairline bg-porcelain py-24 md:py-32">
          <Container size="wide">
            <SectionHeading
              eyebrow="On display"
              title="Featured at this showroom"
              className="mb-14"
            />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {featured.map((p: { slug: string; name: string; collection?: string | null; lifestyleImage?: string | null; category?: { slug: string } | null }) => (
                <Link

                  key={p.slug}
                  href={`/products/${p.category?.slug ?? "tiles"}/${p.slug}`}
                  className="group block"
                >
                  <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-stone-100">
                    {p.lifestyleImage && (
                      <Image
                        src={p.lifestyleImage}
                        alt={p.name}
                        fill
                        sizes="(max-width: 640px) 100vw, 25vw"
                        className="object-cover transition-transform duration-[1.4s] group-hover:scale-108"
                      />
                    )}
                  </div>
                  <p className="mt-4 font-semibold text-ink transition-colors group-hover:text-gold">
                    {p.name}
                  </p>
                  {p.collection && <p className="text-sm text-stone-400">{p.collection}</p>}
                </Link>
              ))}
            </div>
          </Container>
        </section>
      )}

      <GoogleReviews showroom={s} />

      {/* Booking CTA */}
      <section className="bg-ink py-24 text-ivory md:py-32">
        <Container className="text-center">
          <p className="text-eyebrow text-gold">Visit {s.locality ?? s.city}</p>
          <h2 className="text-display-sm mx-auto mt-5 max-w-2xl">
            We&apos;ll have the samples ready before you arrive.
          </h2>
          <p className="mx-auto mt-6 max-w-lg text-ivory/60">
            Book a slot and tell us what you&apos;re building — a consultant will be waiting
            with the right collections pulled out for you.
          </p>
          <Reveal delay={0.2}>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <ButtonLink href={`/book-visit?showroom=${s.slug}`} variant="primary" size="lg">
                Book a Visit
                <ArrowUpRight className="h-5 w-5" />
              </ButtonLink>
              <ButtonLink href="/request-quote" variant="outline" size="lg">
                Request a Quote
              </ButtonLink>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* Other showrooms */}
      {others.length > 0 && (
        <section className="bg-ivory py-20 md:py-24">
          <Container size="wide">
            <p className="text-eyebrow mb-8 flex items-center gap-2 text-gold">
              <Store className="h-3.5 w-3.5" />
              Our other showrooms
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {others.map((o) => (
                <Link
                  key={o.slug}
                  href={`/showrooms/${o.slug}`}
                  className="group rounded-2xl border hairline bg-white p-5 shadow-soft transition-all duration-500 hover:-translate-y-1 hover:shadow-float"
                >
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-gold">
                    {o.city}
                  </p>
                  <p className="mt-1.5 font-semibold text-ink transition-colors group-hover:text-gold">
                    {o.locality ?? o.name}
                  </p>
                  <p className="mt-1 text-sm text-stone-400">{o.name}</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-slate-warm">
                    View showroom
                    <ArrowUpRight className="h-3 w-3 transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </span>
                </Link>
              ))}
            </div>
          </Container>
        </section>
      )}
    </>
  );
}
