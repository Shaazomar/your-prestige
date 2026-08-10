import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { testimonials as fallbackTestimonials } from "@/lib/demo-content";

export interface TestimonialItem {
  id?: string;
  name: string;
  role: string;
  quote: string;
  rating: number;
  image?: string | null;
}

export const getPublishedTestimonials = cache(async (): Promise<TestimonialItem[]> => {
  try {
    const rows = await prisma.testimonial.findMany({
      where: { published: true, deletedAt: null },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    });
    if (rows.length > 0) {
      return rows.map((r) => ({
        id: r.id,
        name: r.name,
        role: r.role || "Client",
        quote: r.quote,
        rating: r.rating || 5,
        image: r.image || r.authorPhoto,
      }));
    }
  } catch {
    // DB fallback
  }

  return fallbackTestimonials.map((t, idx) => ({
    id: `fb-t-${idx}`,
    name: t.name,
    role: t.role,
    quote: t.quote,
    rating: t.rating,
  }));
});
