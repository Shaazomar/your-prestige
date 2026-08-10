import Link from "next/link";
import {
  Package, Tags, Award, BadgePercent, Activity,
  MessageSquare, Box, Eye, AlertTriangle, Layers, ArrowUpRight
} from "lucide-react";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  // Query all stats
  const [
    totalProducts,
    publishedProducts,
    featuredProducts,
    activeOffers,
    whatsappEnquiriesCount,
    totalShowrooms,
    totalCategories,
    totalCollections,
    totalBrands,
    recentLogs,
    outOfStockCount,
    popularProducts,
    recentEnquiries,
  ] = await Promise.all([
    prisma.product.count({ where: { deletedAt: null } }),
    prisma.product.count({ where: { published: true, deletedAt: null } }),
    prisma.product.count({ where: { featured: true, deletedAt: null } }),
    prisma.offer.count({ where: { status: "ACTIVE", deletedAt: null } }),
    prisma.lead.count({ where: { source: "whatsapp", deletedAt: null } }),
    prisma.showroom.count({ where: { deletedAt: null } }),
    prisma.category.count({ where: { deletedAt: null } }),
    prisma.collection.count({ where: { deletedAt: null } }),
    prisma.brand.count({ where: { deletedAt: null } }),
    prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 6, include: { user: { select: { name: true } } } }),
    prisma.inventory.count({ where: { availableStock: 0 } }),
    prisma.product.findMany({ where: { deletedAt: null }, orderBy: { viewCount: "desc" }, take: 5, select: { id: true, name: true, sku: true, viewCount: true } }),
    prisma.lead.findMany({ where: { source: "whatsapp", deletedAt: null }, orderBy: { createdAt: "desc" }, take: 5 }),
  ]);

  // Aggregate product views
  const viewAgg = await prisma.product.aggregate({
    where: { deletedAt: null },
    _sum: { viewCount: true }
  });
  const totalViews = viewAgg._sum.viewCount ?? 0;

  // Calculate low stock warnings
  const inventories = await prisma.inventory.findMany({
    select: { availableStock: true, minimumStock: true }
  });
  const lowStockCount = inventories.filter(i => i.availableStock <= i.minimumStock && i.availableStock > 0).length;

  // Compute Popular Collections based on sum of product views
  const collectionsWithViews = await prisma.collection.findMany({
    where: { deletedAt: null },
    select: {
      name: true,
      products: {
        select: { viewCount: true }
      }
    }
  });

  const popularCollections = collectionsWithViews
    .map(c => ({
      name: c.name,
      views: c.products.reduce((acc, p) => acc + p.viewCount, 0)
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 5);

  const heroStats = [
    { label: "Active Products", value: `${publishedProducts} / ${totalProducts}`, icon: Package, color: "text-emerald-400" },
    { label: "Total Views", value: totalViews.toLocaleString(), icon: Eye, color: "text-blue-400" },
    { label: "WhatsApp Enquiries", value: whatsappEnquiriesCount, icon: MessageSquare, color: "text-green-400" },
    { label: "Active Offers", value: activeOffers, icon: BadgePercent, color: "text-amber-400" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-white/40">Your showroom&apos;s catalog pulse & enquiries at a glance.</p>
      </div>

      {/* Hero Stat Tiles */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {heroStats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-white/8 bg-[#141413] p-6 transition-colors duration-300 hover:border-gold/30">
            <div className="flex items-center justify-between">
              <p className="text-sm text-white/45">{s.label}</p>
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </div>
            <p className="mt-3 text-3xl font-bold tracking-tight">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Inventory & Stock Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/8 bg-[#141413] p-5 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider font-semibold text-white/40 mb-1">Featured Slabs</p>
            <p className="text-xl font-bold text-white">{featuredProducts} Items</p>
          </div>
          <Award className="h-8 w-8 text-gold opacity-80" />
        </div>
        <div className="rounded-2xl border border-white/8 bg-[#141413] p-5 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider font-semibold text-white/40 mb-1">Low Stock Warning</p>
            <p className="text-xl font-bold text-amber-400">{lowStockCount} SKUs</p>
          </div>
          <AlertTriangle className="h-8 w-8 text-amber-400 opacity-80" />
        </div>
        <div className="rounded-2xl border border-white/8 bg-[#141413] p-5 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider font-semibold text-white/40 mb-1">Out of Stock</p>
            <p className="text-xl font-bold text-red-400">{outOfStockCount} SKUs</p>
          </div>
          <Box className="h-8 w-8 text-red-400 opacity-80" />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        {/* Popular products & collections */}
        <div className="rounded-2xl border border-white/8 bg-[#141413] p-6 xl:col-span-3 space-y-6">
          <div>
            <h2 className="font-semibold text-white">Popular Slabs & Products</h2>
            <p className="mt-0.5 text-xs text-white/35">Sorted by number of customer catalog views</p>
          </div>
          
          <div className="space-y-3">
            {popularProducts.map((p, idx) => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-white/30">#{idx + 1}</span>
                  <div>
                    <p className="text-sm font-semibold text-white">{p.name}</p>
                    <p className="text-xs text-white/40">{p.sku || "No SKU"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-white/60 font-semibold">
                  <Eye className="h-3.5 w-3.5" />
                  {p.viewCount} views
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-white/8 pt-6">
            <h2 className="font-semibold text-white mb-3">Popular Tile Collections</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {popularCollections.map((c, idx) => (
                <div key={c.name} className="p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                  <p className="text-xs text-white/30 font-semibold mb-1">RANK #{idx + 1}</p>
                  <p className="text-sm font-bold text-white">{c.name}</p>
                  <p className="text-xs text-gold/80 mt-1">{c.views} aggregated views</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent WhatsApp enquiries */}
        <div className="rounded-2xl border border-white/8 bg-[#141413] p-6 xl:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-white">Recent WhatsApp Orders & Chats</h2>
              <p className="mt-0.5 text-xs text-white/35">Latest messages from WhatsApp widget</p>
            </div>
            <Link href="/admin/leads" className="flex items-center gap-1 text-xs text-gold hover:underline">
              View all <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>

          {recentEnquiries.length === 0 ? (
            <p className="py-12 text-center text-sm text-white/30">No WhatsApp enquiries received yet.</p>
          ) : (
            <div className="space-y-3">
              {recentEnquiries.map((e) => (
                <div key={e.id} className="p-3 rounded-xl border border-white/5 bg-white/[0.02] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white">{e.name}</span>
                    <span className="text-[10px] text-white/30">
                      {new Date(e.createdAt).toLocaleDateString(undefined, { dateStyle: "short" })}
                    </span>
                  </div>
                  <p className="text-xs text-white/50 truncate">{e.message || "Hi, I am interested..."}</p>
                  <p className="text-[10px] text-gold/80 font-mono">{e.phone}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content Counts & Recent logs */}
      <div className="grid gap-6 xl:grid-cols-2">
        {/* Content catalog items summary */}
        <div className="rounded-2xl border border-white/8 bg-[#141413] p-6 space-y-4">
          <h2 className="font-semibold text-white">Showroom Catalog At A Glance</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="border border-white/5 bg-white/[0.02] p-4 rounded-xl">
              <Eye className="h-5 w-5 text-gold mb-2" />
              <p className="text-2xl font-extrabold text-white">{totalShowrooms}</p>
              <p className="text-xs text-white/40">Physical Showrooms</p>
            </div>
            <div className="border border-white/5 bg-white/[0.02] p-4 rounded-xl">
              <Tags className="h-5 w-5 text-gold mb-2" />
              <p className="text-2xl font-extrabold text-white">{totalCategories}</p>
              <p className="text-xs text-white/40">Product Categories</p>
            </div>
            <div className="border border-white/5 bg-white/[0.02] p-4 rounded-xl">
              <Layers className="h-5 w-5 text-gold mb-2" />
              <p className="text-2xl font-extrabold text-white">{totalCollections}</p>
              <p className="text-xs text-white/40">Product Collections</p>
            </div>
            <div className="border border-white/5 bg-white/[0.02] p-4 rounded-xl">
              <Award className="h-5 w-5 text-gold mb-2" />
              <p className="text-2xl font-extrabold text-white">{totalBrands}</p>
              <p className="text-xs text-white/40">Associated Brands</p>
            </div>
          </div>
        </div>

        {/* Recent actions / activity log */}
        <div className="rounded-2xl border border-white/8 bg-[#141413] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold text-white">
              <Activity className="h-4 w-4 text-gold" /> Recent Activity Log
            </h2>
            <Link href="/admin/logs" className="flex items-center gap-1 text-xs text-gold hover:underline">
              View all logs <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {recentLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between p-2.5 rounded-xl border border-white/5 bg-white/[0.01]">
                <div className="min-w-0">
                  <p className="truncate font-mono text-[11px] text-gold">{log.action}</p>
                  <p className="truncate text-[10px] text-white/35">{log.user?.name ?? "System Operator"}</p>
                </div>
                <span className="shrink-0 text-[10px] text-white/30">
                  {new Date(log.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
