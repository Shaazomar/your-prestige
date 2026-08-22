import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import { galleryImages } from "@/lib/demo-content";
import type { DriftWallItem } from "@/components/ui/DriftWall";

/**
 * Fetch gallery items for the /gallery DriftWall.
 * 1. Checks custom GalleryItem records in CMS DB.
 * 2. Checks local files added in public/gallery directory.
 * 3. Fallback to demo-content galleryImages array.
 */
export async function getGalleryItems(): Promise<DriftWallItem[]> {
  try {
    // 1. Check custom GalleryItem records in CMS
    const cmsItems = await prisma.galleryItem.findMany({
      where: { deletedAt: null },
      orderBy: { sortOrder: "asc" },
      select: {
        url: true,
        alt: true,
      },
    });

    if (cmsItems.length > 0) {
      return cmsItems.map((item, index) => ({
        image: item.url,
        title: item.alt || `Prestige Surface ${index + 1}`,
      }));
    }
  } catch (e) {
    console.error("Error fetching CMS gallery items:", e);
  }

  // 2. Read images dynamically from public/gallery folder
  try {
    const galleryDir = path.join(process.cwd(), "public", "gallery");
    if (fs.existsSync(galleryDir)) {
      const files = fs.readdirSync(galleryDir).filter((f) => f.match(/\.(jpg|jpeg|png|webp|avif)$/i));
      if (files.length > 0) {
        return files.map((file, idx) => ({
          image: `/gallery/${encodeURIComponent(file)}`,
          title: `Prestige Gallery — Space ${idx + 1}`,
        }));
      }
    }
  } catch (err) {
    console.error("Error reading public/gallery directory:", err);
  }

  // 3. Fallback to default gallery images
  return galleryImages.map((img) => ({
    image: img.src,
    title: img.alt,
  }));
}
