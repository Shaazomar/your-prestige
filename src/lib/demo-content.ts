/**
 * Curated demo content — stands in for CMS data until the database is seeded.
 * Every structure here mirrors the Prisma models 1:1 so swapping to live
 * data is a query change, not a refactor.
 */

const u = (id: string, w = 1600) =>
  `https://images.unsplash.com/${id}?q=80&w=${w}&auto=format&fit=crop`;

export const collections = [
  {
    slug: "tiles",
    title: "Premium Tiles",
    subtitle: "Italian marble, large-format porcelain & artisan ceramics",
    image: u("photo-1615874959474-d609969a20ed"),
    count: "600+ designs",
  },
  {
    slug: "sanitary",
    title: "Luxury Bathrooms",
    subtitle: "Complete sanctuary suites from the world's finest houses",
    image: u("photo-1600607687939-ce8a6c25118c"),
    count: "250+ suites",
  },
  {
    slug: "sanitary",
    title: "Sanitary Collection",
    subtitle: "Faucets, fittings & wellness engineered to perfection",
    image: u("photo-1552321554-5fefe8c9ef14"),
    count: "400+ pieces",
  },
  {
    slug: "designer-picks",
    title: "Designer Picks",
    subtitle: "Hand-selected statements by our design consultants",
    image: u("photo-1618221195710-dd6b41faaea6"),
    count: "Curated monthly",
  },
] as const;

export const brands = [
  "Kajaria", "Somany", "Jaquar", "Kohler", "Grohe", "Hindware",
  "Cera", "Nitco", "RAK Ceramics", "Simpolo", "Johnson", "Queo",
  "Duravit", "Hansgrohe", "Toto", "Astral",
] as const;

export const galleryImages = [
  { src: u("photo-1600585154340-be6161a56a0c"), alt: "Luxury living room with Italian marble flooring", tall: true },
  { src: u("photo-1584622650111-993a426fbf0a"), alt: "Designer bathroom with brass fittings", tall: false },
  { src: u("photo-1600566753190-17f0baa2a6c3"), alt: "Freestanding bathtub in marble bathroom", tall: false },
  { src: u("photo-1616486338812-3dadae4b4ace"), alt: "Minimal interior with textured tiles", tall: true },
  { src: u("photo-1620626011761-996317b8d101"), alt: "Modern vanity with backlit mirror", tall: false },
  { src: u("photo-1600210492486-724fe5c67fb0"), alt: "Open plan kitchen with porcelain slabs", tall: true },
  { src: u("photo-1586023492125-27b2c045efd7"), alt: "Warm neutral living space", tall: false },
  { src: u("photo-1631679706909-1844bbd07221"), alt: "Spa-inspired shower enclosure", tall: false },
] as const;

export const testimonials = [
  {
    name: "Arjun Shetty",
    role: "Villa Owner, Bejai",
    quote:
      "Walking into Your Prestige felt like entering a design museum. They didn't sell us tiles — they designed our entire home's character.",
    rating: 5,
  },
  {
    name: "Ar. Kavya Rao",
    role: "Principal Architect, KR Studio",
    quote:
      "The only showroom in coastal Karnataka where I can confidently bring my most demanding clients. World-class range, flawless service.",
    rating: 5,
  },
  {
    name: "Mohammed Faisal",
    role: "Builder, Crest Constructions",
    quote:
      "Fifteen projects together and counting. Their large-format porcelain collection rivals what I've seen in Milan showrooms.",
    rating: 5,
  },
  {
    name: "Deepa & Sunil Kamath",
    role: "Homeowners, Kadri",
    quote:
      "From selection to delivery, everything felt effortless. Our bathroom is now the most photographed room in the house.",
    rating: 5,
  },
] as const;

// Product catalog moved to src/lib/catalog.ts — richer model for the
// luxury catalog experience (collections, sizes[], applications, imagery sets).

export const portfolioProjects = [
  {
    slug: "sea-crest-villa",
    title: "Sea Crest Villa",
    type: "Villa",
    location: "Ullal, Mangaluru",
    year: "2025",
    image: u("photo-1613490493576-7fde63acd811"),
    description: "6,400 sq ft coastal villa clad in large-format Italian porcelain.",
  },
  {
    slug: "the-atrium-residences",
    title: "The Atrium Residences",
    type: "Apartment",
    location: "Kadri Hills",
    year: "2024",
    image: u("photo-1560448204-e02f11c3d0e2"),
    description: "48 premium apartments — full tile & sanitary supply partnership.",
  },
  {
    slug: "ocean-pearl-suites",
    title: "Ocean Pearl Suites",
    type: "Hotel",
    location: "Kodialbail",
    year: "2024",
    image: u("photo-1566073771259-6a8506099945"),
    description: "Boutique hotel wellness floors with imported stone surfaces.",
  },
  {
    slug: "meridian-corporate-park",
    title: "Meridian Corporate Park",
    type: "Commercial",
    location: "Bejai",
    year: "2023",
    image: u("photo-1600047509807-ba8f99d2cdde"),
    description: "120,000 sq ft of high-traffic vitrified flooring, zero-defect delivery.",
  },
] as const;

export const faqs = [
  {
    q: "Do you offer home visits and measurements?",
    a: "Yes. Our design consultants visit your site across Mangaluru and Dakshina Kannada, take precise measurements, and prepare a tailored recommendation with 3D visualisations — completely complimentary for projects above a minimum size.",
  },
  {
    q: "Which brands do you carry?",
    a: "We are authorised partners for over 40 Indian and international houses including Kajaria, Kohler, Grohe, Jaquar, Duravit, Hansgrohe, RAK Ceramics and more — with exclusive collections you won't find elsewhere in coastal Karnataka.",
  },
  {
    q: "Do you deliver outside Mangaluru?",
    a: "We deliver across Dakshina Kannada, Udupi, Kasaragod and beyond. For large projects we coordinate logistics, staged deliveries and on-site storage planning.",
  },
  {
    q: "Can architects and builders get trade pricing?",
    a: "Absolutely. We run a dedicated trade programme with priority sampling, dedicated account managers and project-scale pricing. Book a visit to register your practice.",
  },
  {
    q: "Do you help with installation?",
    a: "We work with a vetted network of master installers for large-format slabs, book-matching and specialised sanitary fitting, and we supervise critical installations ourselves.",
  },
] as const;
