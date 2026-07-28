import Link from "next/link";
import { ArrowUpRight, MapPin, Phone, Mail, Clock, Store } from "lucide-react";
import { InstagramIcon, FacebookIcon, ThreadsIcon } from "@/components/ui/BrandIcons";
import { footerNav } from "@/lib/site-config";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/motion/Reveal";
import { Logo } from "@/components/brand/Logo";
import { getBusiness, telHref } from "@/lib/business";
import { prisma } from "@/lib/prisma";

export async function Footer() {
  const business = await getBusiness();

  // Showroom list is CMS-driven; degrade gracefully if the DB is unreachable.
  let showrooms: { slug: string; name: string; locality: string | null; city: string }[] = [];
  try {
    showrooms = await prisma.showroom.findMany({
      where: { published: true, deletedAt: null },
      orderBy: { sortOrder: "asc" },
      select: { slug: true, name: true, locality: true, city: true },
    });
  } catch {
    /* no-op */
  }

  const socials = [
    { icon: InstagramIcon, href: business.instagram, label: "Instagram" },
    { icon: FacebookIcon, href: business.facebook, label: "Facebook" },
    { icon: ThreadsIcon, href: business.threads, label: "Threads" },
  ].filter((s) => s.href);

  return (
    <footer className="bg-ink text-ivory">
      {/* CTA band */}
      <Container size="wide" className="border-b hairline-light">
        <Reveal>
          <div className="flex flex-col items-start justify-between gap-8 py-20 md:flex-row md:items-end md:py-28">
            <div>
              <p className="text-eyebrow mb-5 text-gold">Visit a Showroom</p>
              <h2 className="text-display-lg max-w-3xl">
                Surfaces worth
                <span className="serif-accent text-gold"> experiencing </span>
                in person.
              </h2>
            </div>
            <Link
              href="/book-visit"
              className="group flex h-32 w-32 shrink-0 items-center justify-center rounded-full border border-ivory/20 transition-all duration-700 hover:border-gold hover:bg-gold md:h-40 md:w-40"
              aria-label="Book a visit"
            >
              <ArrowUpRight className="h-10 w-10 transition-transform duration-700 group-hover:rotate-45" />
            </Link>
          </div>
        </Reveal>
      </Container>

      {/* Link columns */}
      <Container size="wide" className="py-16 md:py-20">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Logo size="md" tone="light" withTagline />
            <p className="mt-6 max-w-sm text-sm leading-relaxed text-ivory/50">
              {business.description}
            </p>
            {socials.length > 0 && (
              <div className="mt-8 flex gap-3">
                {socials.map(({ icon: Icon, href, label }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-ivory/15 text-ivory/70 transition-all duration-500 hover:border-gold hover:bg-gold hover:text-ivory"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {(
            [
              ["Explore", footerNav.explore],
              ["Collections", footerNav.collections],
              ["Support", footerNav.support],
            ] as const
          ).map(([title, links]) => (
            <nav key={title} aria-label={title}>
              <p className="text-eyebrow mb-6 text-ivory/40">{title}</p>
              <ul className="space-y-3.5">
                {links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-ivory/70 transition-colors duration-300 hover:text-gold"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* Showroom directory */}
        {showrooms.length > 0 && (
          <div className="mt-14 border-t hairline-light pt-10">
            <p className="text-eyebrow mb-6 flex items-center gap-2 text-ivory/40">
              <Store className="h-3.5 w-3.5" />
              Our {showrooms.length} Showrooms
            </p>
            <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-5">
              {showrooms.map((s) => (
                <Link
                  key={s.slug}
                  href={`/showrooms/${s.slug}`}
                  className="group text-sm text-ivory/70 transition-colors hover:text-gold"
                >
                  <span className="block font-medium">{s.locality ?? s.city}</span>
                  <span className="block text-xs text-ivory/35">{s.city}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Contact strip */}
        <div className="mt-14 grid gap-6 border-t hairline-light pt-10 text-sm text-ivory/60 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
            <span>{business.address}</span>
          </div>
          <div className="flex items-start gap-3">
            <Phone className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
            <a href={telHref(business.phone)} className="hover:text-gold">
              {business.phone}
            </a>
          </div>
          {business.email ? (
            <div className="flex items-start gap-3">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
              <a href={`mailto:${business.email}`} className="hover:text-gold">
                {business.email}
              </a>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <Store className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
              <Link href="/showrooms" className="hover:text-gold">
                Find your nearest showroom
              </Link>
            </div>
          )}
          <div className="flex items-start gap-3">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
            <span>
              {business.hoursWeekdays}
              <br />
              {business.hoursSunday}
            </span>
          </div>
        </div>
      </Container>

      <div className="border-t hairline-light">
        <Container
          size="wide"
          className="flex flex-col items-center justify-between gap-3 py-6 text-xs text-ivory/35 md:flex-row"
        >
          <p>
            © {new Date().getFullYear()} {business.legalName}. All rights reserved.
          </p>
          <p className="serif-accent">{business.tagline}</p>
        </Container>
      </div>
    </footer>
  );
}
