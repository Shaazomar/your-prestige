import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { getBusinessSettings } from "@/app/admin/(dashboard)/settings/actions";
import { WhatsAppManager } from "./WhatsAppManager";

export const dynamic = "force-dynamic";

export default async function AdminWhatsAppPage() {
  await requirePermission("settings", "view");

  const settings = await getBusinessSettings();

  // Aggregate WhatsApp analytics from database
  const [totalClicks, totalEnquiries, totalViews, recentEvents] = await Promise.all([
    prisma.whatsAppAnalytics.count(),
    prisma.whatsAppAnalytics.count({
      where: { eventType: { in: ["PRODUCT_CLICK", "ENQUIRY_LIST_SENT"] } },
    }),
    prisma.product.aggregate({
      where: { deletedAt: null },
      _sum: { viewCount: true },
    }),
    prisma.whatsAppAnalytics.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  const viewCount = totalViews._sum.viewCount ?? 1;
  const conversionRate = ((totalEnquiries / (viewCount || 1)) * 100).toFixed(1);

  // Group top enquired products
  const topProductEvents = await prisma.whatsAppAnalytics.groupBy({
    by: ["productName", "productSku"],
    where: { productName: { not: null } },
    _count: { productName: true },
    orderBy: { _count: { productName: "desc" } },
    take: 5,
  });

  const topProducts = topProductEvents.map((p) => ({
    name: p.productName || "Unknown Product",
    sku: p.productSku || "N/A",
    count: p._count.productName,
  }));

  return (
    <WhatsAppManager
      initialSettings={settings}
      analytics={{
        totalClicks,
        totalEnquiries,
        conversionRate,
        topProducts,
        recentEvents,
      }}
    />
  );
}
