import { siteUrl } from "@/lib/site-config";
import { getBusiness } from "@/lib/business";
import { prisma } from "@/lib/prisma";
import type { Showroom } from "@prisma/client";

function Script({ schema }: { schema: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * Site-wide Organization schema plus one LocalBusiness entry per showroom.
 * Emitted once from the site layout so every page carries the brand + all
 * five physical locations.
 */
export async function OrganizationJsonLd() {
  const business = await getBusiness();

  let showrooms: Showroom[] = [];
  try {
    showrooms = await prisma.showroom.findMany({
      where: { published: true, deletedAt: null },
      orderBy: { sortOrder: "asc" },
    });
  } catch {
    /* DB unreachable — still emit the Organization schema */
  }

  const sameAs = [business.instagram, business.facebook, business.threads].filter(Boolean);

  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteUrl}/#organization`,
    name: business.name,
    legalName: business.legalName,
    slogan: business.tagline,
    description: business.description,
    url: siteUrl,
    logo: { "@type": "ImageObject", url: `${siteUrl}/brand/icon-512.png`, width: 512, height: 512 },
    image: `${siteUrl}/opengraph-image.png`,
    telephone: business.phone,
    ...(business.email ? { email: business.email } : {}),
    sameAs,
    areaServed: [
      "Mangaluru", "Dakshina Kannada", "Puttur", "Moodbidri", "Udupi", "Karnataka",
    ],
    ...(showrooms.length
      ? { department: showrooms.map((s) => ({ "@id": `${siteUrl}/showrooms/${s.slug}/#localbusiness` })) }
      : {}),
  };

  return (
    <>
      <Script schema={organization} />
      {showrooms.map((s) => (
        <ShowroomJsonLd key={s.id} showroom={s} />
      ))}
    </>
  );
}

/** LocalBusiness schema for a single showroom — reusable on its detail page. */
export function ShowroomJsonLd({ showroom: s }: { showroom: Showroom }) {
  const gallery = Array.isArray(s.gallery) ? (s.gallery as string[]) : [];
  const images = [s.heroImage, ...gallery].filter(Boolean).map((u) => `${siteUrl}${u}`);

  const schema = {
    "@context": "https://schema.org",
    "@type": "HomeGoodsStore",
    "@id": `${siteUrl}/showrooms/${s.slug}/#localbusiness`,
    name: s.subtitle ? `${s.name} — ${s.subtitle}` : s.name,
    ...(s.description ? { description: s.description } : {}),
    url: `${siteUrl}/showrooms/${s.slug}`,
    telephone: s.phone,
    ...(s.email ? { email: s.email } : {}),
    priceRange: "₹₹₹",
    ...(images.length ? { image: images.slice(0, 6) } : {}),
    // AggregateRating only when there are real numbers behind it. Emitting a
    // rating with no reviews — or a review count of zero — is invalid markup
    // and gets the whole record ignored.
    ...(s.googleRating && s.googleReviewCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: s.googleRating,
            reviewCount: s.googleReviewCount,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
    parentOrganization: { "@id": `${siteUrl}/#organization` },
    address: {
      "@type": "PostalAddress",
      streetAddress: s.addressLine,
      ...(s.locality ? { addressLocality: s.locality } : {}),
      addressRegion: s.state,
      ...(s.postalCode ? { postalCode: s.postalCode } : {}),
      addressCountry: "IN",
    },
    ...(s.latitude != null && s.longitude != null
      ? { geo: { "@type": "GeoCoordinates", latitude: s.latitude, longitude: s.longitude } }
      : {}),
    ...(s.mapUrl ? { hasMap: s.mapUrl } : {}),
    openingHoursSpecification: buildHoursSpec(s),
  };

  return <Script schema={schema} />;
}

/**
 * Converts the human-readable hours strings into schema.org specs.
 * Mon–Sat is uniform across branches (9:00–19:00); Sunday differs per branch,
 * so it's parsed out of `hoursSunday` and omitted entirely when closed.
 */
function buildHoursSpec(s: Showroom) {
  const spec: Record<string, unknown>[] = [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      opens: "09:00",
      closes: "19:00",
    },
  ];

  const sunday = s.hoursSunday ?? "";
  if (!/closed/i.test(sunday)) {
    // Matches e.g. "Sunday: 9:00 AM – 1:00 PM"
    const m = sunday.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)\s*[–—-]\s*(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/i);
    if (m) {
      const to24 = (h: string, min: string | undefined, mer: string) => {
        let hh = parseInt(h, 10);
        if (/pm/i.test(mer) && hh !== 12) hh += 12;
        if (/am/i.test(mer) && hh === 12) hh = 0;
        return `${String(hh).padStart(2, "0")}:${min ?? "00"}`;
      };
      spec.push({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: "Sunday",
        opens: to24(m[1], m[2], m[3]),
        closes: to24(m[4], m[5], m[6]),
      });
    }
  }
  return spec;
}
