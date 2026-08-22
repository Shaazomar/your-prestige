/**
 * Static site configuration — navigation, canonical URL, and the *fallback*
 * business record.
 *
 * Business details (name, phone, WhatsApp, email, hours, social links) are
 * CMS-managed and live in the `Setting` table. Read them with
 * `getBusiness()` from `src/lib/business.ts`, which falls back to the values
 * below only if the database hasn't been seeded. Do not hardcode business
 * data in components — always read from `getBusiness()`.
 */

export const business = {
  name: "Prestige Tiles & Sanitary",
  legalName: "Prestige Tiles & Sanitary",
  tagline: "Designing Spaces, Crafting Elegance",
  description:
    "Luxury tiles, designer bathrooms and world-class sanitaryware across coastal Karnataka. Five showrooms in Mangaluru, Puttur and Moodbidri — curated for architects, builders and discerning homeowners.",
  phone: "+91 90089 19195",
  whatsapp: "919008919195",
  email: "",
  website: "",
  address: {
    street: "National Highway Road, Near Indian Conventional Hall",
    locality: "Jeppinamogaru",
    city: "Mangaluru",
    district: "Dakshina Kannada",
    state: "Karnataka",
    postalCode: "575008",
    country: "IN",
  },
  geo: { lat: 12.8438, lng: 74.8619 },
  hours: {
    weekdays: "9:00 AM – 7:00 PM",
    sunday: "Jeppinamogaru 9 AM – 1 PM · Puttur 9 AM – 12 PM · other branches closed",
  },
  mapUrl: "https://maps.google.com/?q=Prestige+Tiles+Sanitary+Jeppinamogaru+Mangaluru",
  social: {
    instagram: "https://www.instagram.com/prestige_sanitarytiles/",
    facebook: "https://www.facebook.com/prestige.sanitarytiles",
    threads: "https://www.threads.com/@prestigeshop.in",
  },
  stats: {
    years: 15,
    projects: 2400,
    customers: 12000,
    brands: 40,
  },
} as const;

export const siteUrl = "https://prestigetiles.in";

/**
 * ————— Navigation —————
 *
 * Prestige 2.0 deliberately keeps the bar almost empty. Four destinations
 * sit in the navbar; everything else lives one click away in the fullscreen
 * menu. Adding a fifth item to `primaryNav` is the wrong instinct — put it
 * in `megaMenu` instead.
 */

export interface NavLink {
  label: string;
  href: string;
  /** Optional one-line description, rendered in the fullscreen menu only. */
  hint?: string;
}

/** The only links rendered inline in the navbar. */
export const primaryNav: readonly NavLink[] = [
  { label: "Shop", href: "/products" },
  { label: "Collections", href: "/collections" },
  { label: "Gallery", href: "/gallery" },
  { label: "About", href: "/about" },
];

/**
 * Fullscreen menu. `primary` renders as large editorial type; the rest are
 * grouped supporting columns. Every route the pre-2.0 site exposed is
 * reachable from here — the redesign relocates navigation, it does not
 * remove functionality.
 */
export const megaMenu = {
  primary: [
    { label: "Products", href: "/products", hint: "The full catalogue" },
    { label: "Collections", href: "/collections", hint: "Curated ranges" },
    { label: "Applications", href: "/applications", hint: "Room by room" },
    { label: "Brands", href: "/brands", hint: "Who we partner with" },
    { label: "Gallery", href: "/gallery", hint: "Installed work" },
    { label: "Downloads", href: "/catalogue", hint: "Catalogues & specs" },
    { label: "Contact", href: "/contact", hint: "Talk to us" },
  ] satisfies NavLink[],

  catalogue: [
    { label: "Premium Tiles", href: "/products/tiles" },
    { label: "Sanitaryware", href: "/products/sanitary" },
    { label: "Designer Picks", href: "/products/designer-picks" },
    { label: "Compare Products", href: "/compare" },
    { label: "Saved Items", href: "/wishlist" },
  ] satisfies NavLink[],

  spaces: [
    { label: "Living Room", href: "/applications/living-room" },
    { label: "Kitchen & Slab", href: "/applications/kitchen" },
    { label: "Bathroom & Spa", href: "/applications/bathroom" },
    { label: "Outdoor & Patio", href: "/applications/outdoor" },
    { label: "Commercial", href: "/applications/commercial" },
  ] satisfies NavLink[],

  company: [
    { label: "About Prestige", href: "/about" },
    { label: "Showrooms", href: "/showrooms" },
    { label: "Become a Dealer", href: "/become-dealer" },
    { label: "Testimonials", href: "/testimonials" },
    { label: "Journal", href: "/blog" },
  ] satisfies NavLink[],

  visit: [
    { label: "Book a Showroom Visit", href: "/book-visit" },
    { label: "Request a Quote", href: "/request-quote" },
    { label: "Current Offers", href: "/offers" },
    { label: "FAQs", href: "/faqs" },
  ] satisfies NavLink[],
} as const;

/** Minimal footer. Logo, a short link list, contact, social, newsletter. */
export const footerNav = {
  explore: [
    { label: "Collections", href: "/collections" },
    { label: "Products", href: "/products" },
    { label: "Gallery", href: "/gallery" },
  ] satisfies NavLink[],

  company: [
    { label: "About", href: "/about" },
    { label: "Showrooms", href: "/showrooms" },
    { label: "Become a Dealer", href: "/become-dealer" },
    { label: "Contact", href: "/contact" },
  ] satisfies NavLink[],

  legal: [
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
  ] satisfies NavLink[],
} as const;

