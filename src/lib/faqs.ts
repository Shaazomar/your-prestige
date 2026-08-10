import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { faqs as fallbackFaqs } from "@/lib/demo-content";

export interface FaqItem {
  id?: string;
  q: string;
  a: string;
  category?: string | null;
}

export const getPublishedFaqs = cache(async (): Promise<FaqItem[]> => {
  try {
    const rows = await prisma.faq.findMany({
      where: { published: true, deletedAt: null },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });
    if (rows.length > 0) {
      return rows.map((r) => ({
        id: r.id,
        q: r.question,
        a: r.answer,
        category: r.category,
      }));
    }
  } catch {
    // DB fallback
  }

  return fallbackFaqs.map((f, idx) => ({
    id: `fb-faq-${idx}`,
    q: f.q,
    a: f.a,
  }));
});
