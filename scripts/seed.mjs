// Seeds demo leads so the admin dashboard & kanban render with life.
// Run: node scripts/seed.mjs
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const leads = [
  { name: "Arjun Shetty", phone: "+91 98450 11223", type: "VISIT", status: "NEW", interest: "tiles", message: "Building a villa in Ullal — want to see large-format marble slabs.", daysAgo: 0, visitInDays: 2 },
  { name: "Kavya Rao", phone: "+91 99860 44556", type: "QUOTE", status: "NEW", interest: "project", message: "Architect — need trade pricing for a 12-apartment project.", daysAgo: 0 },
  { name: "Mohammed Faisal", phone: "+91 97400 77889", type: "CONTACT", status: "CONTACTED", interest: "both", message: "Renovating two bathrooms in Kadri.", daysAgo: 1 },
  { name: "Deepa Kamath", phone: "+91 96860 22334", type: "VISIT", status: "QUALIFIED", interest: "sanitary", message: "Looking for a freestanding tub and brushed gold fittings.", daysAgo: 2, visitInDays: 1 },
  { name: "Suresh Pai", phone: "+91 94480 55667", type: "QUOTE", status: "QUOTED", interest: "tiles", budget: "5l-15l", message: "3BHK flooring — comparing vitrified options.", daysAgo: 4 },
  { name: "Anita D'Souza", phone: "+91 98860 88990", type: "VISIT", status: "VISITED", interest: "both", message: "Visited Saturday — loved the Carrara Lumina slab.", daysAgo: 5 },
  { name: "Rakesh Bhat", phone: "+91 95910 33445", type: "QUOTE", status: "WON", interest: "project", budget: "15l-plus", message: "Crest Constructions — Phase 2 supply confirmed.", daysAgo: 8 },
  { name: "Lakshmi Nayak", phone: "+91 90350 66778", type: "CONTACT", status: "CONTACTED", interest: "tiles", message: "Kitchen backsplash ideas?", daysAgo: 3 },
  { name: "Vinod Kulkarni", phone: "+91 91080 99001", type: "QUOTE", status: "LOST", interest: "tiles", message: "Went with a local dealer on price.", daysAgo: 11 },
  { name: "Preethi Hegde", phone: "+91 93425 11224", type: "VISIT", status: "NEW", interest: "sanitary", message: "Saw the Instagram reel about the rain shower wall.", daysAgo: 1, visitInDays: 4 },
  { name: "Ganesh Acharya", phone: "+91 98805 44557", type: "CONTACT", status: "QUALIFIED", interest: "both", message: "New home at Bejai — full package enquiry.", daysAgo: 6 },
  { name: "Fatima Beary", phone: "+91 97390 77880", type: "QUOTE", status: "WON", interest: "sanitary", budget: "2l-5l", message: "Master bath suite — confirmed Kohler package.", daysAgo: 12 },
];

const day = 24 * 60 * 60 * 1000;

for (const l of leads) {
  const createdAt = new Date(Date.now() - l.daysAgo * day);
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
      createdAt,
      visitDate: l.visitInDays ? new Date(Date.now() + l.visitInDays * day) : null,
    },
  });
}

console.log(`Seeded ${leads.length} demo leads.`);
await prisma.$disconnect();
