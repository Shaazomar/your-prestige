import { auth } from "@/lib/auth";
import { can, requirePermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { ImageReviewManager } from "./ImageReviewManager";
import { getImageReviewStats } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Image Review & Recovery" };

export default async function ImageReviewPage() {
  await requirePermission("products", "view");

  const session = await auth();
  const role = session!.user.role;

  const [stats, brands] = await Promise.all([
    getImageReviewStats(),
    prisma.brand.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Image Review & Recovery</h1>
        <p className="mt-1 text-sm text-white/40">
          Audit and manage catalogue photography health. Products without verified images are kept safely in draft/hidden state so the public website remains immaculate.
        </p>
      </div>
      <ImageReviewManager
        canEdit={can(role, "products", "edit")}
        initialStats={stats}
        brands={brands}
      />
    </div>
  );
}
