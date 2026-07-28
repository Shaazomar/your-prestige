/**
 * The Prestige Catalogue — rich product data powering the luxury catalog
 * experience. Every field mirrors the Prisma `Product` model 1:1, so
 * wiring this to the database later is a query swap, not a rewrite.
 */

const u = (id: string, w = 1800) =>
  `https://images.unsplash.com/${id}?q=80&w=${w}&auto=format&fit=crop`;

export type Application =
  | "Living Room"
  | "Bedroom"
  | "Bathroom"
  | "Kitchen"
  | "Outdoor"
  | "Commercial"
  | "Hotel"
  | "Villa"
  | "Office"
  | "Restaurant"
  | "Hospital";

export const applicationList: Application[] = [
  "Living Room",
  "Bedroom",
  "Bathroom",
  "Kitchen",
  "Outdoor",
  "Commercial",
  "Hotel",
  "Villa",
  "Office",
  "Restaurant",
  "Hospital",
];

export interface CatalogProduct {
  slug: string;
  name: string;
  collection: string;
  brand: string;
  category: "tiles" | "sanitary" | "designer-picks";
  finish: string;
  thickness: string;
  sizes: string[];
  applications: Application[];
  color: string;
  texture: string;
  tag?: "Bestseller" | "New Arrival" | "Designer Pick" | "Premium" | "Limited";
  description: string;
  /** Dominant card/hero image — a full room scene, never a flat crop */
  lifestyleImage: string;
  /** Macro material close-up */
  textureImage: string;
  /** Additional angles / installations / room visualizations */
  gallery: string[];
  /** Masonry rhythm — varies card silhouette across the grid */
  aspect: "portrait" | "square" | "landscape";
  featured?: boolean;
}

export const products: CatalogProduct[] = [
  {
    slug: "carrara-lumina-slab",
    name: "Carrara Lumina",
    collection: "Lumina Marble Collection",
    brand: "Kajaria",
    category: "tiles",
    finish: "Polished Porcelain",
    thickness: "9 mm",
    sizes: ["600 × 1200 mm", "800 × 1600 mm", "1200 × 2400 mm"],
    applications: ["Living Room", "Commercial", "Hotel", "Office"],
    color: "Ivory White",
    texture: "Book-matched veining",
    tag: "Bestseller",
    description:
      "A faithful reproduction of Italian Carrara marble — soft grey veins drifting across a luminous ivory field. Book-matched laying doubles the drama across large floors and feature walls.",
    lifestyleImage: u("photo-1600585154340-be6161a56a0c"),
    textureImage: u("photo-1615873968403-89e068629265"),
    gallery: [
      u("photo-1600210492486-724fe5c67fb0"),
      u("photo-1586023492125-27b2c045efd7"),
      u("photo-1600047509807-ba8f99d2cdde"),
    ],
    aspect: "portrait",
    featured: true,
  },
  {
    slug: "basalt-noir-matte",
    name: "Basalt Noir",
    collection: "Volcanica Collection",
    brand: "Simpolo",
    category: "tiles",
    finish: "Matte Porcelain",
    thickness: "10 mm",
    sizes: ["800 × 1600 mm", "600 × 600 mm"],
    applications: ["Living Room", "Commercial", "Office"],
    color: "Deep Charcoal",
    texture: "Honed volcanic stone",
    tag: "New Arrival",
    description:
      "Volcanic basalt reimagined in porcelain — a deep, matte charcoal that anchors a room with quiet authority. Slip-resistant enough for verandahs, refined enough for a boardroom lobby.",
    lifestyleImage: u("photo-1616486338812-3dadae4b4ace"),
    textureImage: u("photo-1620641788421-7a1c342ea42e"),
    gallery: [
      u("photo-1600047509807-ba8f99d2cdde"),
      u("photo-1560448204-e02f11c3d0e2"),
      u("photo-1586023492125-27b2c045efd7"),
    ],
    aspect: "landscape",
  },
  {
    slug: "travertine-classico",
    name: "Travertine Classico",
    collection: "Antico Stone Collection",
    brand: "RAK Ceramics",
    category: "tiles",
    finish: "Honed Vitrified",
    thickness: "10 mm",
    sizes: ["600 × 1200 mm", "300 × 600 mm"],
    applications: ["Living Room", "Bedroom", "Villa", "Outdoor"],
    color: "Warm Beige",
    texture: "Natural fossilised pitting",
    tag: "Bestseller",
    description:
      "Sun-warmed travertine texture with the fossilised pitting of quarried Tuscan stone — engineered for consistency, laid for warmth. A favourite for Mediterranean and coastal villa interiors alike.",
    lifestyleImage: u("photo-1613490493576-7fde63acd811"),
    textureImage: u("photo-1615529182904-14819c35db37", 1200),
    gallery: [
      u("photo-1600607687939-ce8a6c25118c"),
      u("photo-1566073771259-6a8506099945"),
      u("photo-1560448204-e02f11c3d0e2"),
    ],
    aspect: "square",
  },
  {
    slug: "onyx-drift-porcelain",
    name: "Onyx Drift",
    collection: "Lumina Marble Collection",
    brand: "Somany",
    category: "tiles",
    finish: "High-Gloss Porcelain",
    thickness: "9 mm",
    sizes: ["1200 × 2400 mm", "800 × 1600 mm"],
    applications: ["Living Room", "Hotel", "Commercial"],
    color: "Amber Onyx",
    texture: "Backlit-ready translucency",
    tag: "Premium",
    description:
      "An amber onyx pattern with a translucent quality that comes alive under backlighting — reserved for the one wall in the house designed to be talked about.",
    lifestyleImage: u("photo-1600121848594-d8644e57abab"),
    textureImage: u("photo-1560184897-ae75f418493e"),
    gallery: [
      u("photo-1600585154340-be6161a56a0c"),
      u("photo-1541123437800-1bb1317badc2"),
      u("photo-1600210492486-724fe5c67fb0"),
    ],
    aspect: "portrait",
  },
  {
    slug: "aurum-freestanding-tub",
    name: "Aurum Freestanding Tub",
    collection: "Sanctuary Bath Collection",
    brand: "Kohler",
    category: "sanitary",
    finish: "Gloss Acrylic",
    thickness: "—",
    sizes: ["1700 mm", "1800 mm"],
    applications: ["Bathroom", "Villa", "Hotel"],
    color: "Alpine White",
    texture: "Seamless sculpted acrylic",
    tag: "Designer Pick",
    description:
      "A sculptural freestanding silhouette that turns bathing into ritual. Deep-soak geometry, whisper-quiet drainage, and a form that photographs beautifully from every angle.",
    lifestyleImage: u("photo-1600566753190-17f0baa2a6c3"),
    textureImage: u("photo-1552321554-5fefe8c9ef14"),
    gallery: [
      u("photo-1584622650111-993a426fbf0a"),
      u("photo-1631679706909-1844bbd07221"),
      u("photo-1620626011761-996317b8d101"),
    ],
    aspect: "landscape",
    featured: true,
  },
  {
    slug: "cascata-rain-system",
    name: "Cascata Rain System",
    collection: "Cascata Wellness Collection",
    brand: "Grohe",
    category: "sanitary",
    finish: "Brushed Gold PVD",
    thickness: "—",
    sizes: ["300 mm head", "400 mm head"],
    applications: ["Bathroom", "Hotel", "Villa", "Restaurant"],
    color: "Brushed Gold",
    texture: "PVD-coated brass",
    tag: "Premium",
    description:
      "A ceiling-mounted rain system engineered for a spa-grade downpour. The brushed gold PVD finish resists tarnish and fingerprints — engineered to look this good for decades.",
    lifestyleImage: u("photo-1631679706909-1844bbd07221"),
    textureImage: u("photo-1552321554-5fefe8c9ef14"),
    gallery: [
      u("photo-1600566753190-17f0baa2a6c3"),
      u("photo-1620626011761-996317b8d101"),
      u("photo-1584622650111-993a426fbf0a"),
    ],
    aspect: "portrait",
  },
  {
    slug: "onda-wall-basin",
    name: "Onda Wall Basin",
    collection: "Onda Sculptural Series",
    brand: "Duravit",
    category: "sanitary",
    finish: "Ceramic White",
    thickness: "—",
    sizes: ["600 mm", "800 mm"],
    applications: ["Bathroom", "Office", "Commercial"],
    color: "Matte White",
    texture: "Sculpted wave ceramic",
    tag: "New Arrival",
    description:
      "A wave-form basin that treats the sink as sculpture — wall-mounted for a floating, weightless presence and effortlessly easy floor cleaning beneath.",
    lifestyleImage: u("photo-1620626011761-996317b8d101"),
    textureImage: u("photo-1600121848594-d8644e57abab"),
    gallery: [
      u("photo-1584622650111-993a426fbf0a"),
      u("photo-1600566753190-17f0baa2a6c3"),
      u("photo-1631679706909-1844bbd07221"),
    ],
    aspect: "square",
  },
  {
    slug: "terra-linea-outdoor",
    name: "Terra Linea",
    collection: "Exterra Outdoor Collection",
    brand: "Nitco",
    category: "tiles",
    finish: "Structured Anti-Slip",
    thickness: "20 mm",
    sizes: ["600 × 600 mm", "600 × 1200 mm"],
    applications: ["Outdoor", "Villa", "Hotel", "Restaurant"],
    color: "Sandstone Grey",
    texture: "Linear structured grip",
    tag: "New Arrival",
    description:
      "20mm-thick pavers engineered for pool decks, verandahs and monsoon-exposed walkways — full R11 grip without sacrificing the linear, architectural look of dressed stone.",
    lifestyleImage: u("photo-1600047509807-ba8f99d2cdde"),
    textureImage: u("photo-1615529182904-14819c35db37", 1200),
    gallery: [
      u("photo-1613490493576-7fde63acd811"),
      u("photo-1566073771259-6a8506099945"),
      u("photo-1600210492486-724fe5c67fb0"),
    ],
    aspect: "landscape",
  },
  {
    slug: "quartzo-kitchen-slab",
    name: "Quartzo Kitchen Slab",
    collection: "Culina Surface Collection",
    brand: "RAK Ceramics",
    category: "designer-picks",
    finish: "Polished Ultra-Compact",
    thickness: "12 mm",
    sizes: ["1200 × 3200 mm", "1600 × 3200 mm"],
    applications: ["Kitchen", "Commercial", "Restaurant"],
    color: "Pearl Quartz",
    texture: "Fine-grain quartz composite",
    tag: "Designer Pick",
    description:
      "An ultra-compact surface engineered for the hardest-working room in the house — stain-proof, heat-resistant, and seamless enough to wrap a waterfall island edge without a visible joint.",
    lifestyleImage: u("photo-1600210492486-724fe5c67fb0"),
    textureImage: u("photo-1560184897-ae75f418493e"),
    gallery: [
      u("photo-1586023492125-27b2c045efd7"),
      u("photo-1600121848594-d8644e57abab"),
      u("photo-1541123437800-1bb1317badc2"),
    ],
    aspect: "portrait",
    featured: true,
  },
];

export function getRelated(product: CatalogProduct, count = 3): CatalogProduct[] {
  return products
    .filter((p) => p.slug !== product.slug)
    .sort((a, b) => {
      const score = (p: CatalogProduct) =>
        (p.category === product.category ? 2 : 0) +
        (p.collection === product.collection ? 2 : 0) +
        (p.brand === product.brand ? 1 : 0);
      return score(b) - score(a);
    })
    .slice(0, count);
}

export const brandList = Array.from(new Set(products.map((p) => p.brand))).sort();
export const collectionList = Array.from(new Set(products.map((p) => p.collection))).sort();
export const finishList = Array.from(new Set(products.map((p) => p.finish))).sort();
export const sizeList = Array.from(new Set(products.flatMap((p) => p.sizes))).sort();
