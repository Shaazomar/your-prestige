// Seeds the Postgres database: a Super Admin login + realistic sample
// content so every admin module has real data to work against.
// Run: node scripts/seed.mjs
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

const prisma = new PrismaClient();
const day = 24 * 60 * 60 * 1000;

async function seedAdmin() {
  const email = (process.env.SEED_ADMIN_EMAIL || "owner@yourprestige.in").toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin user already exists: ${email} (skipping)`);
    return;
  }

  const password = process.env.SEED_ADMIN_PASSWORD || randomBytes(9).toString("base64url");
  const hash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      email,
      name: "Showroom Owner",
      password: hash,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
    },
  });

  console.log("\n=== ADMIN LOGIN CREATED ===");
  console.log(`Email:    ${email}`);
  console.log(`Password: ${password}`);
  console.log("Change this after first login (Users & Roles module).\n");
}

async function seedCategories() {
  const count = await prisma.category.count();
  if (count > 0) return console.log("Categories already seeded, skipping.");

  const tiles = await prisma.category.create({
    data: { slug: "tiles", name: "Tiles", sortOrder: 1, icon: "grid" },
  });
  const sanitary = await prisma.category.create({
    data: { slug: "sanitary", name: "Sanitaryware", sortOrder: 2, icon: "droplet" },
  });
  await prisma.category.create({
    data: { slug: "designer-picks", name: "Designer Picks", sortOrder: 3, icon: "sparkles" },
  });
  await prisma.category.create({
    data: { slug: "marble-tiles", name: "Marble Tiles", parentId: tiles.id, sortOrder: 1 },
  });
  await prisma.category.create({
    data: { slug: "porcelain-tiles", name: "Porcelain Tiles", parentId: tiles.id, sortOrder: 2 },
  });
  await prisma.category.create({
    data: { slug: "bathtubs", name: "Bathtubs", parentId: sanitary.id, sortOrder: 1 },
  });
  console.log("Seeded 6 categories (with nesting).");
}

async function seedBrands() {
  const count = await prisma.brand.count();
  if (count > 0) return console.log("Brands already seeded, skipping.");

  const names = ["Kajaria", "Somany", "Jaquar", "Kohler", "Grohe", "Hindware", "Cera", "RAK Ceramics", "Simpolo", "Duravit"];
  for (const [i, name] of names.entries()) {
    await prisma.brand.create({
      data: {
        slug: name.toLowerCase().replace(/\s+/g, "-"),
        name,
        featured: i < 4,
        sortOrder: i,
        published: true,
      },
    });
  }
  console.log(`Seeded ${names.length} brands.`);
}

async function seedProducts() {
  const count = await prisma.product.count();
  if (count > 0) return console.log("Products already seeded, skipping.");

  const tiles = await prisma.category.findUnique({ where: { slug: "tiles" } });
  const sanitary = await prisma.category.findUnique({ where: { slug: "sanitary" } });
  const kajaria = await prisma.brand.findUnique({ where: { slug: "kajaria" } });
  const kohler = await prisma.brand.findUnique({ where: { slug: "kohler" } });

  const u = (id) => `https://images.unsplash.com/${id}?q=80&w=1800&auto=format&fit=crop`;

  await prisma.product.create({
    data: {
      slug: "carrara-lumina-slab",
      name: "Carrara Lumina",
      collection: "Lumina Marble Collection",
      finish: "Polished Porcelain",
      thickness: "9 mm",
      sizes: ["600 × 1200 mm", "800 × 1600 mm", "1200 × 2400 mm"],
      applications: ["Living Room", "Commercial", "Hotel"],
      color: "Ivory White",
      texture: "Book-matched veining",
      tag: "Bestseller",
      aspect: "portrait",
      description: "A faithful reproduction of Italian Carrara marble.",
      lifestyleImage: u("photo-1600585154340-be6161a56a0c"),
      textureImage: u("photo-1615873968403-89e068629265"),
      images: [u("photo-1600210492486-724fe5c67fb0"), u("photo-1586023492125-27b2c045efd7")],
      featured: true,
      published: true,
      categoryId: tiles?.id,
      brandId: kajaria?.id,
    },
  });

  await prisma.product.create({
    data: {
      slug: "aurum-freestanding-tub",
      name: "Aurum Freestanding Tub",
      collection: "Sanctuary Bath Collection",
      finish: "Gloss Acrylic",
      sizes: ["1700 mm", "1800 mm"],
      applications: ["Bathroom", "Villa", "Hotel"],
      color: "Alpine White",
      texture: "Seamless sculpted acrylic",
      tag: "Designer Pick",
      aspect: "landscape",
      description: "A sculptural freestanding silhouette for spa-grade bathing.",
      lifestyleImage: u("photo-1600566753190-17f0baa2a6c3"),
      textureImage: u("photo-1552321554-5fefe8c9ef14"),
      images: [u("photo-1584622650111-993a426fbf0a")],
      featured: true,
      designerPick: true,
      published: true,
      categoryId: sanitary?.id,
      brandId: kohler?.id,
    },
  });

  console.log("Seeded 2 products.");
}

async function seedPortfolio() {
  const count = await prisma.project.count();
  if (count > 0) return console.log("Portfolio already seeded, skipping.");

  await prisma.project.create({
    data: {
      slug: "sea-crest-villa",
      title: "Sea Crest Villa",
      type: "Villa",
      client: "Private Residence",
      builder: "Crest Constructions",
      architect: "KR Studio",
      location: "Ullal, Mangaluru",
      year: "2025",
      completionDate: new Date("2025-11-01"),
      description: "6,400 sq ft coastal villa clad in large-format Italian porcelain.",
      images: ["https://images.unsplash.com/photo-1613490493576-7fde63acd811?q=80&w=1600&auto=format&fit=crop"],
      featured: true,
      published: true,
    },
  });
  console.log("Seeded 1 portfolio project.");
}

async function seedGallery() {
  const count = await prisma.galleryAlbum.count();
  if (count > 0) return console.log("Gallery already seeded, skipping.");

  const album = await prisma.galleryAlbum.create({
    data: { slug: "showroom-tour", title: "Showroom Tour", published: true },
  });
  await prisma.galleryItem.create({
    data: {
      albumId: album.id,
      url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1600&auto=format&fit=crop",
      alt: "Luxury living room with Italian marble flooring",
      sortOrder: 1,
    },
  });
  console.log("Seeded 1 gallery album with 1 item.");
}

async function seedVideos() {
  const count = await prisma.video.count();
  if (count > 0) return console.log("Videos already seeded, skipping.");

  await prisma.video.create({
    data: {
      slug: "showroom-walkthrough",
      title: "Showroom Walkthrough",
      provider: "YOUTUBE",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      category: "Showroom",
      featured: true,
      published: true,
    },
  });
  console.log("Seeded 1 video.");
}

async function seedTestimonials() {
  const count = await prisma.testimonial.count();
  if (count > 0) return console.log("Testimonials already seeded, skipping.");

  await prisma.testimonial.create({
    data: {
      name: "Arjun Shetty",
      role: "Villa Owner, Bejai",
      quote: "Walking into Your Prestige felt like entering a design museum.",
      rating: 5,
      featured: true,
      published: true,
      source: "manual",
    },
  });
  console.log("Seeded 1 testimonial.");
}

async function seedBlog() {
  const count = await prisma.post.count();
  if (count > 0) return console.log("Blog already seeded, skipping.");

  const admin = await prisma.user.findFirst({ where: { role: "SUPER_ADMIN" } });
  await prisma.post.create({
    data: {
      slug: "large-format-tiles-guide-2026",
      title: "The 2026 Guide to Large-Format Tiles",
      excerpt: "Fewer grout lines, grander rooms, calmer surfaces.",
      content: "# The 2026 Guide to Large-Format Tiles\n\nFull article body goes here.",
      category: "Guides",
      tags: ["tiles", "design"],
      published: true,
      publishedAt: new Date(),
      authorId: admin?.id,
    },
  });
  console.log("Seeded 1 blog post.");
}

async function seedFaqs() {
  const count = await prisma.faq.count();
  if (count > 0) return console.log("FAQs already seeded, skipping.");

  await prisma.faq.create({
    data: {
      question: "Do you offer home visits and measurements?",
      answer: "Yes, complimentary for qualifying projects.",
      category: "Visits",
      sortOrder: 1,
      published: true,
    },
  });
  console.log("Seeded 1 FAQ.");
}

async function seedOffers() {
  const count = await prisma.offer.count();
  if (count > 0) return console.log("Offers already seeded, skipping.");

  await prisma.offer.create({
    data: {
      title: "The New Home Privilege",
      description: "Complimentary design consultation for full-home projects.",
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 60 * day),
      showCountdown: true,
      published: true,
    },
  });
  console.log("Seeded 1 offer.");
}

async function seedLeads() {
  const count = await prisma.lead.count();
  if (count > 0) return console.log("Leads already seeded, skipping.");

  const leads = [
    { name: "Arjun Shetty", phone: "+91 98450 11223", type: "VISIT", status: "NEW", interest: "tiles", message: "Building a villa in Ullal.", daysAgo: 0, visitInDays: 2 },
    { name: "Kavya Rao", phone: "+91 99860 44556", type: "QUOTE", status: "NEW", interest: "project", message: "Architect — need trade pricing.", daysAgo: 0 },
    { name: "Mohammed Faisal", phone: "+91 97400 77889", type: "CONTACT", status: "CONTACTED", interest: "both", message: "Renovating two bathrooms.", daysAgo: 1 },
    { name: "Deepa Kamath", phone: "+91 96860 22334", type: "VISIT", status: "QUALIFIED", interest: "sanitary", message: "Freestanding tub enquiry.", daysAgo: 2, visitInDays: 1 },
    { name: "Suresh Pai", phone: "+91 94480 55667", type: "QUOTE", status: "QUOTED", interest: "tiles", budget: "5l-15l", message: "3BHK flooring.", daysAgo: 4 },
    { name: "Anita D'Souza", phone: "+91 98860 88990", type: "VISIT", status: "VISITED", interest: "both", message: "Loved the Carrara Lumina slab.", daysAgo: 5 },
    { name: "Rakesh Bhat", phone: "+91 95910 33445", type: "QUOTE", status: "WON", interest: "project", budget: "15l-plus", message: "Phase 2 supply confirmed.", daysAgo: 8 },
    { name: "Lakshmi Nayak", phone: "+91 90350 66778", type: "CONTACT", status: "CONTACTED", interest: "tiles", message: "Kitchen backsplash ideas?", daysAgo: 3 },
    { name: "Vinod Kulkarni", phone: "+91 91080 99001", type: "QUOTE", status: "LOST", interest: "tiles", message: "Went with a local dealer.", daysAgo: 11 },
    { name: "Preethi Hegde", phone: "+91 93425 11224", type: "VISIT", status: "NEW", interest: "sanitary", message: "Rain shower wall enquiry.", daysAgo: 1, visitInDays: 4 },
  ];

  for (const l of leads) {
    await prisma.lead.create({
      data: {
        name: l.name,
        phone: l.phone,
        type: l.type,
        status: l.status,
        interest: l.interest,
        budget: l.budget ?? null,
        message: l.message,
        source: "website",
        createdAt: new Date(Date.now() - l.daysAgo * day),
        visitDate: l.visitInDays ? new Date(Date.now() + l.visitInDays * day) : null,
      },
    });
  }
  console.log(`Seeded ${leads.length} leads.`);
}

async function seedBookings() {
  const count = await prisma.booking.count();
  if (count > 0) return console.log("Bookings already seeded, skipping.");

  const admin = await prisma.user.findFirst({ where: { role: "SUPER_ADMIN" } });
  await prisma.booking.create({
    data: {
      name: "Arjun Shetty",
      phone: "+91 98450 11223",
      requestedDate: new Date(Date.now() + 2 * day),
      status: "PENDING",
      notes: "Interested in marble slabs for a villa project.",
      assignedConsultantId: admin?.id,
    },
  });
  console.log("Seeded 1 booking.");
}

/**
 * Official business details. These are upserted (not skip-if-exists) so
 * re-running the seed corrects stale values, while anything an admin has
 * edited afterwards in Settings can simply be re-edited there.
 */
async function seedSettings() {
  const defaults = {
    "business.name": "Prestige Tiles & Sanitary",
    "business.legalName": "Prestige Tiles & Sanitary",
    "business.tagline": "Designing Spaces, Crafting Elegance",
    "business.description":
      "Luxury tiles, designer bathrooms and world-class sanitaryware across coastal Karnataka. Five showrooms in Mangaluru, Puttur and Moodbidri.",
    "business.phone": "+91 90089 19195",
    "business.whatsapp": "919008919195",
    // Email and website are intentionally blank — not yet supplied.
    "business.email": "",
    "business.website": "",
    "business.address":
      "National Highway Road, Near Indian Conventional Hall, Jeppinamogaru, Mangaluru",
    "business.mapUrl":
      "https://www.google.com/maps/search/?api=1&query=Prestige+Tiles+%26+Sanitary+Jeppinamogaru+Mangaluru",
    "business.hoursWeekdays": "Monday–Saturday: 9:00 AM – 7:00 PM",
    "business.hoursSunday":
      "Sunday: Jeppinamogaru 9 AM – 1 PM · Puttur 9 AM – 12 PM · other branches closed",
    "social.instagram": "https://www.instagram.com/prestige_sanitarytiles/",
    "social.facebook": "https://www.facebook.com/prestige.sanitarytiles",
    "social.threads": "https://www.threads.com/@prestigeshop.in",
    "theme.accent": "#b3915a",
    "maintenance.enabled": false,
    "maintenance.message": "We're upgrading the showroom experience. Back shortly.",
  };
  for (const [key, value] of Object.entries(defaults)) {
    await prisma.setting.upsert({ where: { key }, create: { key, value }, update: { value } });
  }
  console.log(`Seeded/updated ${Object.keys(defaults).length} settings.`);
}

/**
 * The five real Prestige showrooms.
 *
 * NOTE ON COORDINATES: latitude/longitude are approximate locality centroids,
 * used only to rank "nearest showroom" for visitors who grant location access.
 * They should be corrected to exact pin positions via Admin → Showrooms.
 *
 * NOTE ON MAP URLS: exact Google Maps place links were not supplied, so these
 * are Maps *search* URLs built from each address — they resolve correctly but
 * should be replaced with canonical place URLs in the admin.
 */
async function seedShowrooms() {
  const count = await prisma.showroom.count();
  if (count > 0) return console.log("Showrooms already seeded, skipping.");

  const img = (n) => `/showrooms/showroom-${String(n).padStart(2, "0")}.webp`;
  const mapsSearch = (q) =>
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;

  const SAT = "Monday–Saturday: 9:00 AM – 7:00 PM";
  const CLOSED = "Sunday: Closed";

  const showrooms = [
    {
      slug: "jeppinamogaru-mangaluru",
      name: "Your Prestige Tiles & Sanitary",
      subtitle: "Jaquar Authorized Dealer",
      addressLine: "National Highway Road, Near Indian Conventional Hall",
      locality: "Jeppinamogaru",
      city: "Mangaluru",
      postalCode: "575008",
      latitude: 12.8438,
      longitude: 74.8619,
      phone: "+91 90089 19195",
      whatsapp: "919008919195",
      hoursWeekdays: SAT,
      hoursSunday: "Sunday: 9:00 AM – 1:00 PM",
      isFlagship: true,
      sortOrder: 1,
      description:
        "Our flagship destination on the National Highway — an immersive walk-through of complete bathroom sanctuaries, live shower systems and large-format surfaces. Authorized Jaquar dealer with the widest display in the region.",
      brands: ["Jaquar", "Kohler", "Grohe", "Essco", "Kajaria", "Somany", "RAK Ceramics"],
      amenities: ["Customer Parking", "Design Consultation", "Live Shower Displays", "Architect Lounge"],
      directions:
        "On the National Highway service road beside Indian Conventional Hall. Ample on-site parking at the front of the building.",
      heroImage: img(1),
      gallery: [img(2), img(3), img(4), img(5), img(6), img(7), img(8), img(9)],
    },
    {
      slug: "pandeshwar-mangaluru",
      name: "Prestige Enterprises",
      subtitle: "Tiles & Sanitaryware",
      addressLine: "Pandeshwar",
      locality: "Pandeshwar",
      city: "Mangaluru",
      latitude: 12.8654,
      longitude: 74.839,
      phone: "+91 90089 19195",
      whatsapp: "919008919195",
      hoursWeekdays: SAT,
      hoursSunday: CLOSED,
      sortOrder: 2,
      description:
        "Our city-centre showroom in Pandeshwar — a curated selection of sanitaryware, fittings and everyday premium tiles, convenient for central Mangaluru projects.",
      brands: ["Jaquar", "Essco", "Hindware", "Cera", "Kajaria"],
      amenities: ["Design Consultation", "Trade Counter"],
      heroImage: img(10),
      gallery: [img(11), img(12), img(13), img(14), img(15), img(16)],
    },
    {
      slug: "derlakatte-mangaluru",
      name: "Prestige Enterprises",
      subtitle: "Prestige View Building",
      addressLine: "Prestige View Building, University Road, Belma",
      locality: "Derlakatte",
      city: "Mangaluru",
      latitude: 12.813,
      longitude: 74.872,
      phone: "+91 90089 19195",
      whatsapp: "919008919195",
      hoursWeekdays: SAT,
      hoursSunday: CLOSED,
      sortOrder: 3,
      description:
        "On University Road at Belma, Derlakatte — serving the fast-growing southern corridor with a full sanitaryware and tile display across two levels.",
      brands: ["Jaquar", "Kohler", "Essco", "Somany", "Simpolo"],
      amenities: ["Customer Parking", "Design Consultation"],
      directions: "Prestige View Building on University Road, Belma — near Derlakatte junction.",
      heroImage: img(17),
      gallery: [img(18), img(19), img(20), img(21), img(22), img(23)],
    },
    {
      slug: "puttur",
      name: "Pro Prestige",
      subtitle: "Tiles & Sanitaryware",
      addressLine: "Yelmudi Bridge",
      locality: "Yelmudi",
      city: "Puttur",
      latitude: 12.7594,
      longitude: 75.201,
      phone: "+91 70199 63812",
      whatsapp: "917019963812",
      hoursWeekdays: SAT,
      hoursSunday: "Sunday: 9:00 AM – 12:00 PM",
      sortOrder: 4,
      description:
        "Our Puttur branch at Yelmudi Bridge brings the full Prestige range inland — tiles, sanitaryware and fittings for homes and projects across the taluk.",
      brands: ["Jaquar", "Essco", "Kajaria", "Hindware"],
      amenities: ["Customer Parking", "Sunday Hours"],
      directions: "Beside Yelmudi Bridge on the main Puttur road.",
      heroImage: img(24),
      gallery: [img(25), img(26), img(27), img(28), img(29), img(30)],
    },
    {
      slug: "moodbidri",
      name: "Accu Prestige",
      subtitle: "Tiles & Sanitaryware",
      addressLine: "Solapur–Mangaluru Highway, Alangar",
      locality: "Alangar",
      city: "Moodbidri",
      latitude: 13.068,
      longitude: 74.996,
      phone: "+91 99809 96939",
      whatsapp: "919980996939",
      hoursWeekdays: SAT,
      hoursSunday: CLOSED,
      sortOrder: 5,
      description:
        "On the Solapur–Mangaluru Highway at Alangar, Moodbidri — a highway-side showroom with easy access and a broad tile and sanitaryware display.",
      brands: ["Jaquar", "Essco", "Somany", "Nitco"],
      amenities: ["Highway Access", "Customer Parking"],
      directions: "Directly on the Solapur–Mangaluru Highway at Alangar.",
      heroImage: img(31),
      gallery: [img(32), img(33), img(34), img(35), img(36), img(37), img(38), img(39)],
    },
  ];

  for (const s of showrooms) {
    await prisma.showroom.create({
      data: {
        ...s,
        mapUrl: mapsSearch(
          `${s.name} ${s.addressLine} ${s.locality ?? ""} ${s.city} Karnataka`
        ),
        published: true,
      },
    });
  }
  console.log(`Seeded ${showrooms.length} showrooms.`);
}

async function main() {
  await seedAdmin();
  await seedCategories();
  await seedBrands();
  await seedProducts();
  await seedPortfolio();
  await seedGallery();
  await seedVideos();
  await seedTestimonials();
  await seedBlog();
  await seedFaqs();
  await seedOffers();
  await seedLeads();
  await seedBookings();
  await seedSettings();
  await seedShowrooms();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
