import { prisma } from "@/lib/prisma";
import { galleryImages } from "@/lib/demo-content";
import type { DriftWallItem } from "@/components/ui/DriftWall";

const arr = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.length > 0) : [];

/**
 * Fetch gallery items from the CMS database.
 * Priority:
 * 1. GalleryAlbum / GalleryItem records created in CMS
 * 2. Product images uploaded in CMS
 * 3. Fallback demo gallery images
 */
export async function getGalleryItems(): Promise<DriftWallItem[]> {
  try {
    // 1. Check custom GalleryItems in CMS
    const cmsItems = await prisma.galleryItem.findMany({
      where: { deletedAt: null },
      orderBy: { sortOrder: "asc" },
      select: {
        url: true,
        alt: true,
      },
    });

    if (cmsItems.length > 0) {
      return cmsItems.map((item) => ({
        image: item.url,
        title: item.alt || "Prestige Gallery",
      }));
    }

    // 2. Fetch product images from CMS catalogue
    const products = await prisma.product.findMany({
      where: { published: true, deletedAt: null },
      select: {
        name: true,
        lifestyleImage: true,
        textureImage: true,
        images: true,
      },
      take: 30,
    });

    const productItems: DriftWallItem[] = [];
    for (const p of products) {
      if (p.lifestyleImage) {
        productItems.push({ image: p.lifestyleImage, title: p.name });
      }
      if (p.textureImage && p.textureImage !== p.lifestyleImage) {
        productItems.push({ image: p.textureImage, title: p.name });
      }
      const extraImages = arr(p.images);
      for (const img of extraImages) {
        if (!productItems.some((i) => i.image === img)) {
          productItems.push({ image: img, title: p.name });
        }
      }
    }

    if (productItems.length > 0) {
      return productItems;
    }
  } catch (e) {
    console.error("Error fetching CMS gallery items:", e);
  }

  // 3. Fallback to default gallery images
  return galleryImages.map((img) => ({
    image: img.src,
    title: img.alt,
  }));
}
