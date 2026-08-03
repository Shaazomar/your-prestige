import Link from "next/link";
import { MapPin, Phone, Mail, MessageCircle } from "lucide-react";
import { InstagramIcon, FacebookIcon, ThreadsIcon } from "@/components/ui/BrandIcons";
import { footerNav, type NavLink } from "@/lib/site-config";
import { Logo } from "@/components/brand/Logo";
import { getBusiness, telHref, waHref } from "@/lib/business";
import { NewsletterForm } from "./NewsletterForm";

/**
 * Minimal footer: lockup, two short link columns, contact, newsletter.
 *
 * The pre-2.0 footer carried a six-column sitemap. Navigation now lives in
 * the fullscreen menu, so this only needs the handful of links people
 * actually reach for at the bottom of a page.
 */
export async function Footer() {
  const business = await getBusiness();

  const socials = [
    { Icon: InstagramIcon, href: business.instagram, label: "Instagram" },
    { Icon: FacebookIcon, href: business.facebook, label: "Facebook" },
    { Icon: ThreadsIcon, href: business.threads, label: "Threads" },
  ].filter((s) => s.href);

  return (
    <footer className="border-t border-line bg-canvas">
      <div className="mx-auto w-full max-w-[110rem] px-6 py-16 sm:px-8 md:py-24 lg:px-14">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-10">
          {/* Lockup + newsletter */}
          <div className="lg:col-span-5">
            <Logo size="md" tone="light" />
            <p className="mt-6 max-w-sm text-sm leading-relaxed text-muted">
              {business.tagline}
            </p>

            <div className="mt-10 max-w-sm">
              <h2 className="text-eyebrow mb-4 text-faint">Newsletter</h2>
              <NewsletterForm />
            </div>
          </div>

          {/* Links */}
          <FooterColumn title="Explore" links={footerNav.explore} className="lg:col-span-2" />
          <FooterColumn title="Company" links={footerNav.company} className="lg:col-span-2" />

          {/* Contact */}
          <div className="lg:col-span-3">
            <h2 className="text-eyebrow mb-5 text-faint">Visit</h2>
            <ul className="space-y-4 text-sm">
              <li>
                <a
                  href={business.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex gap-3 text-muted transition-colors duration-500 hover:text-gold"
                >
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{business.address}</span>
                </a>
              </li>
              <li>
                <a
                  href={telHref(business.phone)}
                  className="flex items-center gap-3 text-muted transition-colors duration-500 hover:text-gold"
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
                    className="flex items-center gap-3 text-muted transition-colors duration-500 hover:text-gold"
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
                    className="flex items-center gap-3 text-muted transition-colors duration-500 hover:text-gold"
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
        <div className="mt-16 flex flex-col gap-6 border-t border-line pt-8 md:mt-20 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-faint">
            © {new Date().getFullYear()} {business.legalName}. All rights reserved.
          </p>

          <div className="flex items-center gap-6">
            {footerNav.legal.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm text-faint transition-colors duration-500 hover:text-gold"
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
                    className="text-faint transition-colors duration-500 hover:text-gold"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
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
      <h2 className="text-eyebrow mb-5 text-faint">{title}</h2>
      <ul className="space-y-3">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="text-sm text-muted transition-colors duration-500 hover:text-gold"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
