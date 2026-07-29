/**
 * Seeds the eight local-SEO landing pages.
 *
 *   node scripts/seed-landing-pages.mjs
 *
 * Every page has its own copy, its own FAQs and its own angle. This is
 * deliberate and it is the whole point: eight pages that differ only by place
 * name are a doorway-page pattern, which Google demotes. Each page below is
 * written around something actually true of that location or product type —
 * Puttur's Sunday hours, Derlakatte's proximity to the hospital belt,
 * Moodbidri's temple-town building stock, large-format's handling needs.
 *
 * Idempotent: upserts by slug, so re-running refreshes copy rather than
 * duplicating pages. Editors can then refine any of it in the admin.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PAGES = [
  {
    slug: "tiles-mangaluru",
    sortOrder: 1,
    city: "Mangaluru",
    serviceType: "Tiles",
    title: "Tiles in Mangaluru — Prestige Tiles & Sanitary",
    heading: "Tiles in Mangaluru, chosen at full scale.",
    subheading: "Five showrooms across the city, and every surface displayed as you'd actually lay it.",
    intro:
      "Choosing tile from a 300 mm sample is guesswork — veining repeats, joints read differently, and a shade that looks warm under showroom light can turn grey against Mangaluru's overcast monsoon sky. Our showrooms display full-size panels and complete floor lays for exactly that reason.",
    areaServed: ["Mangaluru", "Jeppinamogaru", "Pandeshwar", "Derlakatte", "Kankanady", "Bejai", "Kadri", "Surathkal"],
    blocks: [
      {
        heading: "Built for a coastal climate",
        body: "Mangaluru gets over 3,000 mm of rain a year and salt-laden air year round. That rules out a lot of what looks good in a catalogue. We steer outdoor and semi-covered areas towards low-porosity vitrified bodies with an anti-skid rating, and we'll tell you plainly when a finish you like is wrong for a balcony here.",
      },
      {
        heading: "Every major brand, under one roof",
        body: "We're authorised partners rather than resellers, which means current-season collections, genuine warranty support, and the ability to source a specific article code rather than talking you into whatever is in stock.",
      },
      {
        heading: "For architects and builders",
        body: "Project-scale pricing, priority sampling and a named account manager. If you're specifying for a whole development, we'll hold stock against your phasing rather than making you buy it all at once.",
      },
    ],
    faqs: [
      { q: "Which tiles suit Mangaluru's monsoon?", a: "For anything exposed or semi-covered, look for vitrified tiles with low water absorption and an anti-skid surface. Highly polished finishes become genuinely dangerous underfoot when wet, which matters on a balcony or car porch here more than almost anywhere." },
      { q: "Do you deliver across Mangaluru?", a: "Yes, across the city and the wider Dakshina Kannada district. Delivery is scheduled around your site's readiness, so material isn't sitting exposed before it's needed." },
      { q: "Can I see a full floor laid out before deciding?", a: "That's what the showrooms are for. We display full-size panels and complete lays rather than sample boards, because repeat patterns and veining only reveal themselves at scale." },
    ],
  },
  {
    slug: "tiles-puttur",
    sortOrder: 2,
    city: "Puttur",
    serviceType: "Tiles",
    title: "Tiles in Puttur — Prestige Tiles & Sanitary",
    heading: "A full tile showroom in Puttur.",
    subheading: "Open Sunday mornings, because that's when building work gets planned.",
    intro:
      "Puttur customers were driving to Mangaluru for anything beyond a basic range. Our Puttur showroom carries the same collections as the city branches, with the same authorised-partner pricing and no trip down the highway.",
    areaServed: ["Puttur", "Kabaka", "Bantwal", "Vitla", "Uppinangady", "Sullia", "Kadaba"],
    blocks: [
      {
        heading: "Open when you're free",
        body: "Puttur is one of two branches open on Sunday mornings, 9 AM to 12 noon. Most self-build customers plan on a Sunday, and a showroom that's shut on the one day you can visit isn't much use.",
      },
      {
        heading: "Stocked for how people build here",
        body: "Puttur builds tend towards independent houses rather than apartments, with generous floor plates and traditional layouts. The range here leans accordingly — larger formats for open living areas, and hardwearing rustic finishes for verandahs and outdoor kitchens.",
      },
      {
        heading: "Sanitaryware too",
        body: "Complete bathroom suites from Jaquar, Kohler, Hindware and Cera, displayed as working installations so you can judge the height, reach and feel before committing.",
      },
    ],
    faqs: [
      { q: "What are the Puttur showroom's hours?", a: "Monday to Saturday, 9:00 AM to 7:00 PM, and Sunday from 9:00 AM to 12 noon. The Sunday morning opening is specifically for customers planning their own builds." },
      { q: "Is the Puttur range smaller than Mangaluru?", a: "The display is smaller, but the catalogue is identical. Anything we carry can be brought to Puttur — usually within a few working days — and our team will show you the full range on request." },
      { q: "Do you cover Sullia and Uppinangady?", a: "Yes. Puttur is our base for the eastern taluks, and we deliver throughout that belt." },
    ],
  },
  {
    slug: "tiles-moodbidri",
    sortOrder: 3,
    city: "Moodbidri",
    serviceType: "Tiles",
    title: "Tiles in Moodbidri — Prestige Tiles & Sanitary",
    heading: "Tiles in Moodbidri, for old houses and new.",
    subheading: "A range that respects the town's building stock rather than fighting it.",
    intro:
      "Moodbidri has a particular problem: a great deal of beautiful older housing, laterite and timber, being renovated by owners who don't want it to end up looking like an apartment. Much of the mass-market tile range works against that.",
    areaServed: ["Moodbidri", "Karkala", "Belvai", "Kinnigoli", "Mulki", "Padubidri"],
    blocks: [
      {
        heading: "Renovating, not replacing",
        body: "For a house with laterite walls and a tiled roof, high-gloss porcelain reads as an intrusion. Terracotta-look bodies, honed stone finishes and matte rustic surfaces sit far more comfortably — and in vitrified form they're vastly easier to maintain than the originals.",
      },
      {
        heading: "Temple-town scale",
        body: "Moodbidri's larger halls and covered courtyards suit big-format tile, where fewer joints keep a long span calm. We carry formats up to 1600 × 3200 mm, and can advise on the substrate preparation they genuinely require.",
      },
      {
        heading: "Straightforward advice",
        body: "If a tile is wrong for your application, we'll say so. Selling someone a polished surface for a wet courtyard is a callback we'd rather not have.",
      },
    ],
    faqs: [
      { q: "What suits a traditional Moodbidri house?", a: "Matte and rustic finishes in terracotta, sand and stone tones generally sit better with laterite and timber than gloss. In vitrified form you get the look with far less maintenance than natural terracotta." },
      { q: "Can you handle large-format tile for a hall?", a: "Yes, up to 1600 × 3200 mm. Do talk to us about the floor preparation first — big formats are unforgiving of an uneven substrate, and that's where most problems start." },
      { q: "Do you serve Karkala too?", a: "Yes, Karkala and the surrounding area are covered from Moodbidri." },
    ],
  },
  {
    slug: "tiles-derlakatte",
    sortOrder: 4,
    city: "Mangaluru",
    locality: "Derlakatte",
    serviceType: "Tiles",
    title: "Tiles in Derlakatte, Mangaluru — Prestige Tiles & Sanitary",
    heading: "Tiles in Derlakatte.",
    subheading: "On the hospital and college belt, with a range built for high-traffic buildings.",
    intro:
      "Derlakatte's development is driven by institutions — hospitals, medical colleges, hostels and the housing that surrounds them. That produces a very specific set of tiling requirements, and the showroom here is stocked for it.",
    areaServed: ["Derlakatte", "Deralakatte", "Konaje", "Natekal", "Mudipu", "Ullal", "Someshwar"],
    blocks: [
      {
        heading: "Specified for institutional use",
        body: "Corridors that see thousands of footfalls a day need full-body vitrified tile, where the colour runs through the body so wear doesn't expose a different shade underneath. We stock it, and we can supply matching skirting and stair nosing.",
      },
      {
        heading: "Healthcare-appropriate surfaces",
        body: "Clinical areas need low-porosity, chemical-resistant surfaces with minimal joints — grout lines are the weak point for hygiene. We'll help specify the tile and the grout together, which is usually where this gets overlooked.",
      },
      {
        heading: "Rental and hostel builds",
        body: "For buildings that turn over tenants frequently, the economics favour a hardwearing mid-range tile in a shade that hides wear, available in quantity and re-orderable in two years' time when a room needs patching. We'll point you at ranges that will still exist then.",
      },
    ],
    faqs: [
      { q: "What tile suits a hospital or clinic?", a: "Full-body vitrified with low water absorption, in a large format to minimise grout lines, paired with an epoxy grout. The grout matters as much as the tile for cleanability, and it's the part most specifications forget." },
      { q: "Do you supply in bulk for institutional projects?", a: "Yes — project pricing, phased delivery against your construction schedule, and stock held so later phases match the first." },
      { q: "Is there parking at the Derlakatte showroom?", a: "Yes, customer parking is available on site." },
    ],
  },
  {
    slug: "luxury-tiles-karnataka",
    sortOrder: 5,
    city: "Mangaluru",
    serviceType: "Luxury Tiles",
    title: "Luxury Tiles in Karnataka — Prestige Tiles & Sanitary",
    heading: "Luxury tile, without the trip to Bengaluru.",
    subheading: "Italian-made slabs, book-matched marble and designer collections, held in Dakshina Kannada.",
    intro:
      "The assumption has always been that serious specification work means a trip to Bengaluru. It doesn't. We hold genuine luxury collections — full-body porcelain slabs, book-matched marble-look panels and designer ranges — in Mangaluru, with the technical support they require.",
    areaServed: ["Karnataka", "Dakshina Kannada", "Udupi", "Mangaluru", "Manipal", "Kundapura", "Karkala"],
    blocks: [
      {
        heading: "Book-matched slabs",
        body: "Panels cut so the veining mirrors across a joint, producing a continuous figure across a whole wall. It's the closest a manufactured surface gets to a single block of marble, and it needs planning at the design stage rather than at installation.",
      },
      {
        heading: "Slabs up to 1600 × 3200 mm",
        body: "Large enough to clad a wall or wrap an island with a single piece. These require experienced handling and proper substrate preparation, and we'll be direct with you about whether your contractor has done it before.",
      },
      {
        heading: "Specification support",
        body: "For architects and interior designers: technical data sheets, sample panels for client presentations, and honest guidance on lead times. We'd rather tell you a slab is eight weeks out than promise four.",
      },
    ],
    faqs: [
      { q: "What makes a tile 'luxury' rather than expensive?", a: "Mostly the fidelity of the surface and the consistency of the body — how convincingly it reproduces natural stone across many pieces, how many distinct faces exist before the pattern repeats, and whether the colour runs through the body. Price alone tells you very little." },
      { q: "Do you deliver luxury ranges across Karnataka?", a: "Yes. We regularly supply Udupi, Manipal and the wider coastal belt, and can arrange delivery further into Karnataka for project quantities." },
      { q: "Can I get samples before committing?", a: "Yes, and for large-format slabs we'd strongly encourage seeing the full panel in the showroom — a 300 mm sample tells you almost nothing about a book-matched surface." },
    ],
  },
  {
    slug: "bathroom-tiles-mangaluru",
    sortOrder: 6,
    city: "Mangaluru",
    serviceType: "Bathroom Tiles",
    title: "Bathroom Tiles in Mangaluru — Prestige Tiles & Sanitary",
    heading: "Bathroom tiles in Mangaluru.",
    subheading: "Wall, floor and the bits between — specified as one surface, not three purchases.",
    intro:
      "Most bathroom problems are specification problems: a floor tile too slippery when wet, a wall tile that doesn't have a matching trim, or a shower area where the fall was decided after the tile was bought. We plan the whole envelope together.",
    areaServed: ["Mangaluru", "Jeppinamogaru", "Pandeshwar", "Derlakatte", "Kankanady", "Bejai", "Kadri"],
    blocks: [
      {
        heading: "Anti-skid where it counts",
        body: "A wet bathroom floor is the most common place a home injury happens. Ask for the R-rating: R10 is a sensible minimum for a domestic bathroom floor, and higher inside a walk-in shower. A polished tile that looks superb dry is a genuine hazard wet.",
      },
      {
        heading: "Wall and floor as one scheme",
        body: "We keep coordinated wall and floor ranges together so the tones actually work as a set, along with the trims, skirting and step tiles that finish the job. Discovering there's no matching trim after the tile is laid is a bad afternoon.",
      },
      {
        heading: "Complete suites on display",
        body: "Sanitaryware from Jaquar, Kohler, Grohe, Hindware and Cera, shown as working installations. You can test the reach of a shower arm and the height of a basin, which no photograph conveys.",
      },
    ],
    faqs: [
      { q: "What's the best tile for a bathroom floor?", a: "A matte or textured vitrified tile with an R10 rating or better, in a format small enough that the fall to the drain works cleanly. Save the polished finishes for walls." },
      { q: "Should wall and floor tiles match?", a: "They should be coordinated, not identical. A common approach is a larger, lighter wall tile with a darker, textured floor — it makes the room feel taller and hides water marks where they actually appear." },
      { q: "Can you supply the sanitaryware too?", a: "Yes, and it's worth doing together — the tile layout and the fittings interact more than people expect, particularly around a shower niche or a wall-hung WC." },
    ],
  },
  {
    slug: "jaquar-dealer-mangaluru",
    sortOrder: 7,
    city: "Mangaluru",
    serviceType: "Jaquar",
    title: "Jaquar Dealer in Mangaluru — Prestige Tiles & Sanitary",
    heading: "Authorised Jaquar dealer in Mangaluru.",
    subheading: "The full range, on display and under warranty.",
    intro:
      "We're an authorised Jaquar dealer, not a reseller. That distinction matters when something needs a warranty claim two years from now: the purchase is on record, the product is genuine, and the support path is direct.",
    areaServed: ["Mangaluru", "Dakshina Kannada", "Udupi", "Puttur", "Moodbidri", "Bantwal"],
    blocks: [
      {
        heading: "The complete range",
        body: "Faucets, showers, wellness systems, sanitaryware and concealed cisterns across Jaquar's series — from the everyday ranges to the premium lines. Displayed live, so you can feel the weight of a lever and the throw of a shower before you buy it.",
      },
      {
        heading: "Genuine product, genuine warranty",
        body: "Counterfeit fittings are a real problem in this category, and they usually reveal themselves as a failed cartridge a year in. Buying from an authorised dealer means the warranty is honoured without argument.",
      },
      {
        heading: "Spares and service",
        body: "We stock common cartridges, aerators and diverters, so a fault in an older Jaquar fitting doesn't mean replacing the whole unit.",
      },
    ],
    faqs: [
      { q: "Are you an authorised Jaquar dealer?", a: "Yes. We're an authorised partner, which means genuine stock, manufacturer warranty support, and access to the current catalogue rather than old inventory." },
      { q: "Can I get Jaquar spares in Mangaluru?", a: "Yes — we hold commonly needed cartridges and internals, and can order specific parts for older series." },
      { q: "Do you install?", a: "We don't install directly, but we work with plumbers across the region and can recommend someone who has fitted these systems before. For wellness systems and concealed cisterns that experience genuinely matters." },
    ],
  },
  {
    slug: "large-format-tiles-mangaluru",
    sortOrder: 8,
    city: "Mangaluru",
    serviceType: "Large Format Tiles",
    title: "Large Format Tiles in Mangaluru — Prestige Tiles & Sanitary",
    heading: "Large format tiles in Mangaluru.",
    subheading: "Up to 1600 × 3200 mm — and an honest conversation about laying them.",
    intro:
      "Large format transforms a room: fewer joints, a calmer floor, and a continuity ordinary tile can't achieve. It's also the least forgiving material we sell, and most disappointments come from installation rather than the tile.",
    areaServed: ["Mangaluru", "Dakshina Kannada", "Udupi", "Derlakatte", "Surathkal", "Bantwal"],
    blocks: [
      {
        heading: "Why fewer joints matter",
        body: "Grout lines break up a floor visually and collect dirt. Take a room from 600 mm tiles to 1200 × 2400 and you remove most of the lines — the space reads considerably larger, and it's easier to keep clean.",
      },
      {
        heading: "The substrate is everything",
        body: "A large panel cannot follow an uneven floor; it bridges the high points and cracks. The screed needs to be flat within a few millimetres across its length, and you need the right adhesive with full back-buttering. We'd rather talk this through before you buy than after.",
      },
      {
        heading: "Handling and cutting",
        body: "A 1600 × 3200 mm panel needs a suction frame, two people and a rail cutter. Ask your contractor directly whether they've laid this format before. If not, we can point you at teams who have.",
      },
    ],
    faqs: [
      { q: "How large do the tiles go?", a: "Up to 1600 × 3200 mm in porcelain slab, with 800 × 1600 and 1200 × 2400 being the most commonly specified for floors." },
      { q: "Is large format harder to install?", a: "Considerably. It needs a flat substrate, the right adhesive, full coverage behind the tile and proper handling equipment. The tile itself is rarely the problem — preparation is." },
      { q: "Does it suit smaller rooms?", a: "Often yes, counter-intuitively. Fewer joints make a compact bathroom feel larger. The constraint is access — getting a 3200 mm panel up a narrow staircase needs checking first." },
    ],
  },
];

async function main() {
  const showrooms = await prisma.showroom.findMany({
    where: { deletedAt: null },
    select: { id: true, city: true, locality: true },
  });

  let created = 0;
  let updated = 0;

  for (const page of PAGES) {
    // Attach the showrooms nearest to each page's location.
    const matching = showrooms
      .filter(
        (s) =>
          (page.locality && s.locality?.toLowerCase() === page.locality.toLowerCase()) ||
          s.city.toLowerCase() === (page.city ?? "").toLowerCase()
      )
      .map((s) => s.id);

    const data = {
      kind: "local",
      title: page.title,
      heading: page.heading,
      subheading: page.subheading,
      intro: page.intro,
      blocks: page.blocks,
      city: page.city ?? null,
      locality: page.locality ?? null,
      areaServed: page.areaServed,
      serviceType: page.serviceType,
      faqs: page.faqs,
      showroomIds: matching.length ? matching : showrooms.map((s) => s.id),
      published: true,
      sortOrder: page.sortOrder,
    };

    const existing = await prisma.landingPage.findUnique({ where: { slug: page.slug } });
    await prisma.landingPage.upsert({
      where: { slug: page.slug },
      update: data,
      create: { slug: page.slug, ...data },
    });
    if (existing) updated++;
    else created++;
  }

  console.log(`Landing pages seeded — ${created} created, ${updated} updated.`);
  for (const p of PAGES) console.log(`  /${p.slug}`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
