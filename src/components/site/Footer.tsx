import Link from "next/link";
import { MapPin, Phone, Mail, Clock, Store, Send, ShieldCheck } from "lucide-react";
import { InstagramIcon, FacebookIcon, ThreadsIcon } from "@/components/ui/BrandIcons";
import { footerNav } from "@/lib/site-config";

import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/motion/Reveal";
import { Logo } from "@/components/brand/Logo";
import { getBusiness, telHref } from "@/lib/business";
import { prisma } from "@/lib/prisma";

export async function Footer() {
  const business = await getBusiness();

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
    <footer className="bg-charcoal text-white border-t border-white/10">
      {/* Newsletter & CTA Band */}
      <Container size="wide" className="border-b border-white/10 py-16 md:py-20">
        <Reveal>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7">
              <span className="text-eyebrow text-accent mb-3 block">Stay Inspired</span>
              <h2 className="text-heading text-white">
                Receive the annual <span className="serif-accent text-accent">Lookbook</span> & Architectural Releases.
              </h2>
              <p className="text-body-lg text-stone-400 mt-2 max-w-xl">
                Exclusive previews of Italian porcelain slabs, natural stone arrivals, and luxury sanitaryware.
              </p>
            </div>
            <div className="lg:col-span-5">
              <form className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  placeholder="Enter your work email..."
                  required
                  className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3.5 text-sm text-white placeholder:text-stone-500 focus:border-accent focus:bg-white/10 focus:outline-none"
                />
                <button
                  type="submit"
                  className="shrink-0 flex items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-ink hover:bg-accent-hover transition-colors shadow-yellow"
                >
                  Subscribe <Send className="h-4 w-4" />
                </button>
              </form>
              <p className="mt-2 text-xs text-stone-500 flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-accent" /> No spam. Unsubscribe at any time.
              </p>
            </div>
          </div>
        </Reveal>
      </Container>

      {/* Main Sitemap Columns */}
      <Container size="wide" className="py-16 md:py-24">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 md:gap-12">
          {/* Brand info */}
          <div className="col-span-2 md:col-span-3 lg:col-span-2">
            <Logo size="md" tone="light" withTagline />
            <p className="mt-5 text-sm leading-relaxed text-stone-400 max-w-sm">
              {business.description}
            </p>
            <div className="mt-6 flex items-center gap-3">
              {socials.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-stone-300 transition-all hover:border-accent hover:bg-accent hover:text-ink"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links columns */}
          <nav aria-label="Company">
            <p className="text-eyebrow text-accent mb-4">Company</p>
            <ul className="space-y-2.5">
              {footerNav.company.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-xs text-stone-300 hover:text-accent transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Products">
            <p className="text-eyebrow text-accent mb-4">Products</p>
            <ul className="space-y-2.5">
              {footerNav.products.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-xs text-stone-300 hover:text-accent transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Applications">
            <p className="text-eyebrow text-accent mb-4">Applications</p>
            <ul className="space-y-2.5">
              {footerNav.applications.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-xs text-stone-300 hover:text-accent transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Resources & Support">
            <p className="text-eyebrow text-accent mb-4">Resources</p>
            <ul className="space-y-2.5">
              {footerNav.resources.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-xs text-stone-300 hover:text-accent transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Showrooms directory */}
        {showrooms.length > 0 && (
          <div className="mt-16 border-t border-white/10 pt-8">
            <p className="text-eyebrow text-stone-400 mb-4 flex items-center gap-2">
              <Store className="h-4 w-4 text-accent" />
              Our Regional Experience Showrooms
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {showrooms.map((s) => (
                <Link
                  key={s.slug}
                  href={`/showrooms/${s.slug}`}
                  className="rounded-xl border border-white/10 bg-white/5 p-3 hover:border-accent transition-colors group"
                >
                  <span className="block text-xs font-bold text-white group-hover:text-accent">
                    {s.name}
                  </span>
                  <span className="block text-[11px] text-stone-400">{s.city}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Contact info bar */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 border-t border-white/10 pt-8 text-xs text-stone-400">
          <div className="flex items-start gap-3">
            <MapPin className="h-4 w-4 text-accent shrink-0 mt-0.5" />
            <span>{business.address}</span>
          </div>
          <div className="flex items-start gap-3">
            <Phone className="h-4 w-4 text-accent shrink-0 mt-0.5" />
            <a href={telHref(business.phone)} className="hover:text-accent">
              {business.phone}
            </a>
          </div>
          <div className="flex items-start gap-3">
            <Mail className="h-4 w-4 text-accent shrink-0 mt-0.5" />
            <span>sales@prestigetiles.in</span>
          </div>
          <div className="flex items-start gap-3">
            <Clock className="h-4 w-4 text-accent shrink-0 mt-0.5" />
            <span>{business.hoursWeekdays}</span>
          </div>
        </div>
      </Container>

      {/* Copyright */}
      <div className="border-t border-white/10 bg-black/40 py-6">
        <Container size="wide" className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <p>© {new Date().getFullYear()} {business.legalName}. All rights reserved.</p>
          <p className="serif-accent text-stone-400">{business.tagline}</p>
        </Container>
      </div>
    </footer>
  );
}

