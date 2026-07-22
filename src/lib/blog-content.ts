const u = (id: string, w = 1600) =>
  `https://images.unsplash.com/${id}?q=80&w=${w}&auto=format&fit=crop`;

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  cover: string;
  date: string;
  readTime: string;
  sections: { heading: string; body: string }[];
}

export const blogPosts: BlogPost[] = [
  {
    slug: "large-format-tiles-guide-2026",
    title: "The 2026 Guide to Large-Format Tiles: Why Bigger Is Quietly Better",
    excerpt:
      "Fewer grout lines, grander rooms, calmer surfaces. Here's how large-format porcelain is redefining luxury interiors — and what to know before you commit.",
    cover: u("photo-1615874959474-d609969a20ed"),
    date: "2026-06-14",
    readTime: "6 min read",
    sections: [
      {
        heading: "The case for scale",
        body: "A 1200×2400mm slab does something smaller tiles cannot: it lets the eye rest. With grout lines nearly eliminated, floors and walls read as continuous stone — the visual language of five-star lobbies and galleries, now attainable at home. In coastal Karnataka's bright light, that continuity makes even compact rooms feel architected rather than assembled.",
      },
      {
        heading: "Choosing the right surface",
        body: "Polished porcelain amplifies light and suits formal living areas; matte and honed finishes bring warmth and slip-resistance to bathrooms and verandahs. For book-matched marble looks, insist on seeing full slabs side by side — a showroom that only shows you a 600mm sample is hiding the drama you're paying for.",
      },
      {
        heading: "Installation is half the luxury",
        body: "Large-format demands flat substrates, specialised handling and experienced installers. Budget for professional levelling and lippage-control systems. A perfect slab poorly laid is a permanent regret; this is where supervised installation earns its keep.",
      },
    ],
  },
  {
    slug: "bathroom-sanctuary-design-principles",
    title: "Designing a Bathroom Sanctuary: Five Principles from Luxury Hotels",
    excerpt:
      "The world's best hotel bathrooms follow rules you can borrow. Warm neutrals, layered lighting, and one unforgettable statement piece.",
    cover: u("photo-1600607687939-ce8a6c25118c"),
    date: "2026-05-02",
    readTime: "5 min read",
    sections: [
      {
        heading: "One statement, not five",
        body: "A freestanding tub, a sculptural basin, or a book-matched marble wall — pick a single hero and let everything else support it. Luxury bathrooms fail when every element competes for attention.",
      },
      {
        heading: "Layer the light",
        body: "Overhead light alone flattens everything. Add backlit mirrors at face height, a warm wall wash on textured tile, and dimmable everything. Your bathroom should have a morning mode and an evening mode.",
      },
      {
        heading: "Warm minimalism wins",
        body: "Stone beiges, warm greys and brushed metals age gracefully and photograph beautifully. Save bold colour for accessories you can change — commit your permanent surfaces to timelessness.",
      },
    ],
  },
  {
    slug: "choosing-tiles-coastal-karnataka-climate",
    title: "Choosing Tiles for Coastal Karnataka: Humidity, Salt Air & Monsoons",
    excerpt:
      "Mangaluru's climate is beautiful and brutal. The right surfaces shrug it off for decades — here's what locals should specify.",
    cover: u("photo-1600585154340-be6161a56a0c"),
    date: "2026-03-21",
    readTime: "7 min read",
    sections: [
      {
        heading: "Porosity is the enemy",
        body: "In 80%+ humidity, porous surfaces harbour moisture and dull quickly. Full-body vitrified and porcelain tiles with water absorption under 0.5% are the coastal gold standard — they resist staining, salt air and monsoon-season damp alike.",
      },
      {
        heading: "Grip where it matters",
        body: "Monsoon floors get wet. For verandahs, balconies and bathroom floors, specify R10–R11 slip ratings and matte or structured finishes. Reserve high-polish surfaces for protected indoor areas.",
      },
      {
        heading: "Think in decades",
        body: "The cheapest tile is the one you never replace. Premium porcelain costs more per square foot and less per year — and in resale conversations across Mangaluru's growing property market, finish quality is now a headline feature.",
      },
    ],
  },
];
