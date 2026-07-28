import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Prestige Tiles & Sanitary",
    short_name: "Prestige",
    description: "Designing Spaces, Crafting Elegance — luxury tiles and sanitaryware across coastal Karnataka.",
    start_url: "/",
    display: "standalone",
    background_color: "#0b0b0a",
    theme_color: "#0b0b0a",
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/brand/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
