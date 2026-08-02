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
  { label: "Collections", href: "/collections" },
  { label: "Applications", href: "/applications" },
  { label: "Projects", href: "/projects" },
  { label: "Gallery", href: "/gallery" },
  { label: "Become Dealer", href: "/become-dealer" },
  { label: "Catalogue", href: "/catalogue" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
] as const;

export const footerNav = {
  company: [
    { label: "About Prestige", href: "/about" },
    { label: "Why Choose Us", href: "/about#why-us" },
    { label: "Our Infrastructure", href: "/about#infrastructure" },
    { label: "Showrooms", href: "/showrooms" },
    { label: "Become Dealer", href: "/become-dealer" },
  ],
  products: [
    { label: "All Products", href: "/products" },
    { label: "Premium Tiles", href: "/products/tiles" },
    { label: "Sanitaryware", href: "/products/sanitary" },
    { label: "Designer Picks", href: "/products/designer-picks" },
    { label: "All Brands", href: "/brands" },
  ],
  collections: [
    { label: "Lumina Marble", href: "/products?collection=Lumina+Marble+Collection" },
    { label: "Volcanica Basalt", href: "/products?collection=Volcanica+Collection" },
    { label: "Antico Stone", href: "/products?collection=Antico+Stone+Collection" },
    { label: "Sanctuary Bath", href: "/products?collection=Sanctuary+Bath+Collection" },
    { label: "Exterra Outdoor", href: "/products?collection=Exterra+Outdoor+Collection" },
  ],
  applications: [
    { label: "Living Room", href: "/applications/living-room" },
    { label: "Kitchen & Slab", href: "/applications/kitchen" },
    { label: "Bathroom & Spa", href: "/applications/bathroom" },
    { label: "Outdoor & Patio", href: "/applications/outdoor" },
    { label: "Commercial & Office", href: "/applications/commercial" },
  ],
  resources: [
    { label: "Download Catalogue", href: "/catalogue" },
    { label: "Product Comparison", href: "/compare" },
    { label: "Project Gallery", href: "/gallery" },
    { label: "Case Studies", href: "/projects" },
    { label: "Blog & Insights", href: "/blog" },
    { label: "FAQs", href: "/faqs" },
  ],
  support: [
    { label: "Book Showroom Visit", href: "/book-visit" },
    { label: "Request a Quote", href: "/request-quote" },
    { label: "Contact Sales", href: "/contact" },
  ],
} as const;

