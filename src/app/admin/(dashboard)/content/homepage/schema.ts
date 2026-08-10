import { z } from "zod";

export const homepageHeroSchema = z.object({
  eyebrow: z.string().max(150).default(""),
  heading: z.string().min(2).max(200),
  subheading: z.string().max(500).default(""),
  heroImage: z.string().default(""),
  heroVideo: z.string().default(""),
  primaryCtaLabel: z.string().max(60).default(""),
  primaryCtaHref: z.string().max(200).default(""),
  secondaryCtaLabel: z.string().max(60).default(""),
  secondaryCtaHref: z.string().max(200).default(""),

  // Prestige Story section
  storyEyebrow: z.string().max(150).default(""),
  storyTitle: z.string().max(200).default(""),
  storyText1: z.string().max(1000).default(""),
  storyText2: z.string().max(1000).default(""),
  storyMainImage: z.string().default(""),
  storyDetailImage: z.string().default(""),
  storyStatNumber: z.string().max(30).default(""),
  storyStatLabel: z.string().max(100).default(""),
  storyCtaLabel: z.string().max(60).default(""),
  storyCtaHref: z.string().max(200).default(""),
});

export type HomepageHeroInput = z.infer<typeof homepageHeroSchema>;

export const defaultHomepageHero: HomepageHeroInput = {
  eyebrow: "Mangaluru's Luxury Tile & Sanitary Showroom",
  heading: "The Art of Surfaces.",
  subheading:
    "Italian marble. Large-format porcelain. Sanctuary bathrooms. Forty of the world's finest houses — under one immersive roof.",
  heroImage: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2400&auto=format&fit=crop",
  heroVideo: "",
  primaryCtaLabel: "Book a Private Visit",
  primaryCtaHref: "/book-visit",
  secondaryCtaLabel: "Explore Collections",
  secondaryCtaHref: "/products",

  // Prestige Story defaults
  storyEyebrow: "The Prestige Story",
  storyTitle: "Not a tile shop. A destination for design.",
  storyText1: "For over fifteen years, Your Prestige has shaped the finest homes, hotels and landmarks of coastal Karnataka. Our Mangaluru showroom is an immersive gallery — full-scale bathroom sanctuaries, book-matched marble walls, and consultants who think like designers, not salespeople.",
  storyText2: "Every surface we curate is chosen for one reason: it deserves to be lived with.",
  storyMainImage: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=1600&auto=format&fit=crop",
  storyDetailImage: "https://images.unsplash.com/photo-1615873968403-89e068629265?q=80&w=800&auto=format&fit=crop",
  storyStatNumber: "15+",
  storyStatLabel: "Years of Craft",
  storyCtaLabel: "Our Story",
  storyCtaHref: "/about",
};
