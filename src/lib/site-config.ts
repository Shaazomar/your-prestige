/**
 * Central business + site configuration.
 * In production this is hydrated from the CMS (Settings table);
 * these values act as the seed / fallback layer.
 */

export const business = {
  name: "Your Prestige",
  legalName: "Your Prestige Tiles & Sanitary",
  tagline: "The Art of Surfaces",
  description:
    "Mangaluru's premier destination for luxury tiles, designer bathrooms and world-class sanitaryware. Experience an immersive showroom curated for architects, builders and discerning homeowners.",
  phone: "+91 98765 43210",
  whatsapp: "919876543210",
  email: "hello@yourprestige.in",
  address: {
    street: "Prestige Arcade, M.G. Road",
    locality: "Kodialbail",
    city: "Mangaluru",
    district: "Dakshina Kannada",
    state: "Karnataka",
    postalCode: "575003",
    country: "IN",
  },
  geo: { lat: 12.8703, lng: 74.8433 },
  hours: {
    weekdays: "9:30 AM – 8:00 PM",
    sunday: "10:00 AM – 6:00 PM",
  },
  mapUrl: "https://maps.google.com/?q=Your+Prestige+Tiles+Mangaluru",
  social: {
    instagram: "https://instagram.com/yourprestige",
    facebook: "https://facebook.com/yourprestige",
    youtube: "https://youtube.com/@yourprestige",
    linkedin: "https://linkedin.com/company/yourprestige",
  },
  stats: {
    years: 15,
    projects: 2400,
    customers: 12000,
    brands: 40,
  },
} as const;

export const siteUrl = "https://yourprestige.in";

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
  { label: "Portfolio", href: "/portfolio" },
  { label: "Gallery", href: "/gallery" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
] as const;

export const footerNav = {
  explore: [
    { label: "About Us", href: "/about" },
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
