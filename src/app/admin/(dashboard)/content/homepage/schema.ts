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
};
