import Link from "next/link";
import { MapPin, Phone, Mail, MessageCircle } from "lucide-react";
import { InstagramIcon, FacebookIcon, ThreadsIcon } from "@/components/ui/BrandIcons";
import { footerNav, type NavLink } from "@/lib/site-config";
import { Logo } from "@/components/brand/Logo";
import { getBusiness, telHref, waHref } from "@/lib/business";
import { NewsletterForm } from "./NewsletterForm";

/**
 * Footer: lockup, two short link columns, contact, newsletter, wordmark.
 *
 * Navigation lives in the fullscreen menu, so this only needs the handful
 * of links people actually reach for at the bottom of a page.
 *
 * This is the one near-black band on an otherwise warm-white site. It gives
 * the page a floor to land on — without it the content just fades out — and
 * the oversized wordmark underneath signs the page off rather than trailing
 * away into legal small print.
 */
export async function Footer() {
  const business = await getBusiness();

  const socials = [
    { Icon: InstagramIcon, href: business.instagram, label: "Instagram" },
    { Icon: FacebookIcon, href: business.facebook, label: "Facebook" },
    { Icon: ThreadsIcon, href: business.threads, label: "Threads" },
  ].filter((s) => s.href);

  return (
    <footer className="bg-[#141412] text-white">
      <div className="mx-auto w-full max-w-[110rem] px-6 py-16 sm:px-8 md:py-24 lg:px-14">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-10">
          {/* Lockup + newsletter */}
          <div className="lg:col-span-5">
            <Logo size="md" tone="light" />
            <p className="mt-6 max-w-sm text-sm leading-relaxed text-white/55">
              {business.tagline}
            </p>

            <div className="mt-10 max-w-sm">
              <h2 className="text-eyebrow mb-4 text-white/40">Newsletter</h2>
              <NewsletterForm />
            </div>
          </div>

          {/* Links */}
          <FooterColumn title="Explore" links={footerNav.explore} className="lg:col-span-2" />
          <FooterColumn title="Company" links={footerNav.company} className="lg:col-span-2" />

          {/* Contact */}
          <div className="lg:col-span-3">
            <h2 className="text-eyebrow mb-5 text-white/40">Visit</h2>
            <ul className="space-y-4 text-sm">
              <li>
                <a
                  href={business.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex gap-3 text-white/65 transition-colors duration-500 hover:text-gold"
                >
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{business.address}</span>
                </a>
              </li>
              <li>
                <a
                  href={telHref(business.phone)}
                  className="flex items-center gap-3 text-white/65 transition-colors duration-500 hover:text-gold"
                >
                  <Phone className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {business.phone}
                </a>
              </li>
              {business.whatsapp && (
                <li>
                  <a
                    href={waHref(business.whatsapp)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-white/65 transition-colors duration-500 hover:text-gold"
                  >
                    <MessageCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                    WhatsApp
                  </a>
                </li>
              )}
              {business.email && (
                <li>
                  <a
                    href={`mailto:${business.email}`}
                    className="flex items-center gap-3 text-white/65 transition-colors duration-500 hover:text-gold"
                  >
                    <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {business.email}
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Baseline */}
        <div className="mt-16 flex flex-col gap-6 border-t border-white/10 pt-8 md:mt-20 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-white/40">
            © {new Date().getFullYear()} {business.legalName}. All rights reserved.
          </p>

          <div className="flex items-center gap-6">
            {footerNav.legal.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm text-white/40 transition-colors duration-500 hover:text-gold"
              >
                {l.label}
              </Link>
            ))}

            {socials.length > 0 && (
              <div className="ml-2 flex items-center gap-4">
                {socials.map(({ Icon, href, label }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="text-white/40 transition-colors duration-500 hover:text-gold"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Closing wordmark — 100% fully visible, crisp, bold sign-off */}
      <div
        aria-hidden="true"
        className="select-none px-6 pt-10 pb-10 sm:px-8 lg:px-14 text-center overflow-hidden border-t border-white/10"
      >
        <span className="block uppercase whitespace-nowrap text-center font-serif text-[clamp(1.75rem,5.2vw,5.2rem)] font-bold tracking-tight text-white/90">
          {business.name}
        </span>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
  className,
}: {
  title: string;
  links: readonly NavLink[];
  className?: string;
}) {
  return (
    <div className={className}>
      <h2 className="text-eyebrow mb-5 text-white/40">{title}</h2>
      <ul className="space-y-3">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="text-sm text-white/65 transition-colors duration-500 hover:text-gold"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
