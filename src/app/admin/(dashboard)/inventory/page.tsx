import { requirePermission } from "@/lib/rbac";
import { AlertTriangle, CheckCircle2, Box } from "lucide-react";
import { auth } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { InventoryManager } from "./InventoryManager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Inventory & Stock Levels" };

export default async function AdminInventoryPage() {
  await requirePermission("inventory", "view");

  const session = await auth();
  const role = session!.user.role;

  // Query actual stats from the database
  const totalSkus = await prisma.product.count({ where: { deletedAt: null } });
  
  const inventories = await prisma.inventory.findMany({
    select: { availableStock: true, minimumStock: true }
  });

  const totalStockSum = inventories.reduce((sum, i) => sum + i.availableStock, 0);
  const lowStockCount = inventories.filter(i => i.availableStock <= i.minimumStock).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Inventory & Stock Tracking</h1>
        <p className="mt-1 text-sm text-white/40">
          Monitor real-time warehouse stock levels, batch/shade codes, and low stock reorder thresholds.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-white/8 bg-[#141413] p-5">
          <div className="flex items-center justify-between text-white/40 mb-2">
            <span className="text-xs uppercase tracking-wider font-semibold">Total SKUs Tracked</span>
            <Box className="h-4 w-4 text-gold" />
          </div>
          <p className="text-2xl font-bold text-white">{totalSkus}</p>
          <span className="text-xs text-white/40">Active catalog items</span>
        </div>
        <div className="rounded-2xl border border-white/8 bg-[#141413] p-5">
          <div className="flex items-center justify-between text-white/40 mb-2">
            <span className="text-xs uppercase tracking-wider font-semibold">In Stock Slabs</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-white">{totalStockSum.toLocaleString()} Slabs</p>
          <span className="text-xs text-emerald-400 font-medium">Ready for dispatch</span>
        </div>
        <div className="rounded-2xl border border-white/8 bg-[#141413] p-5">
          <div className="flex items-center justify-between text-white/40 mb-2">
            <span className="text-xs uppercase tracking-wider font-semibold">Low Stock Warnings</span>
            <AlertTriangle className="h-4 w-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-white">{lowStockCount} SKUs</p>
          <span className="text-xs text-amber-400 font-medium">Below minimum threshold</span>
        </div>
      </div>

      <InventoryManager canEdit={can(role, "inventory", "edit")} />
    </div>
  );
}
