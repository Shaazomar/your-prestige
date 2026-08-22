import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const SAT = "Monday–Saturday: 9:00 AM – 7:00 PM";
const CLOSED = "Sunday: Closed";
const img = (n) => `/showrooms/showroom-${String(n).padStart(2, "0")}.webp`;
const mapsSearch = (q) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;

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

async function main() {
  // Delete Indiranagar showroom
  const deleted = await prisma.showroom.deleteMany({
    where: {
      slug: {
        contains: "indiranagar"
      }
    }
  });
  console.log(`Deleted ${deleted.count} showroom(s) with slug containing "indiranagar".`);

  // Insert/Update the 5 showrooms
  for (const s of showrooms) {
    const existing = await prisma.showroom.findUnique({
      where: { slug: s.slug }
    });
    if (existing) {
      console.log(`Showroom with slug "${s.slug}" already exists. Updating...`);
      await prisma.showroom.update({
        where: { slug: s.slug },
        data: {
          ...s,
          mapUrl: mapsSearch(`${s.name} ${s.addressLine} ${s.locality ?? ""} ${s.city} Karnataka`),
          published: true,
          deletedAt: null
        }
      });
    } else {
      console.log(`Creating showroom "${s.name}" (${s.slug})...`);
      await prisma.showroom.create({
        data: {
          ...s,
          mapUrl: mapsSearch(`${s.name} ${s.addressLine} ${s.locality ?? ""} ${s.city} Karnataka`),
          published: true
        }
      });
    }
  }
  console.log("Database update completed successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
