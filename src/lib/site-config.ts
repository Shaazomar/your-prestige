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

export const mainNav = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  {
    label: "Products",
    href: "/products",
    children: [
      { label: "Premium Tiles", href: "/products/tiles" },
      { label: "Sanitaryware", href: "/products/sanitary" },
      { label: "Designer Picks", href: "/products/designer-picks" },
    ],
  },
  { label: "Brands", href: "/brands" },
  { label: "Showrooms", href: "/showrooms" },
  { label: "Portfolio", href: "/portfolio" },
  { label: "Gallery", href: "/gallery" },
  { label: "Contact", href: "/contact" },
] as const;

export const footerNav = {
  explore: [
    { label: "About Us", href: "/about" },
    { label: "Our Showrooms", href: "/showrooms" },
    { label: "Portfolio", href: "/portfolio" },
    { label: "Gallery", href: "/gallery" },
    { label: "Testimonials", href: "/testimonials" },
    { label: "Offers", href: "/offers" },
  ],
  collections: [
    { label: "Premium Tiles", href: "/products/tiles" },
    { label: "Luxury Bathrooms", href: "/products/sanitary" },
    { label: "Designer Picks", href: "/products/designer-picks" },
    { label: "All Brands", href: "/brands" },
  ],
  support: [
    { label: "Book a Visit", href: "/book-visit" },
    { label: "Request a Quote", href: "/request-quote" },
    { label: "FAQs", href: "/faqs" },
    { label: "Blog", href: "/blog" },
  ],
} as const;
