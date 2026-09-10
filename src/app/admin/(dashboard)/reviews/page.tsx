import { requirePermission } from "@/lib/rbac";
import { ModuleStub } from "@/components/admin/ModuleStub";

export const dynamic = "force-dynamic";
export const metadata = { title: "Product Reviews" };

/**
 * There is no Review model in the schema, so this screen has nothing real to
 * show. It used to render three invented reviews — named architects, ratings
 * and dates — which read as live moderation data. Until a Review table
 * exists, say so rather than fabricate it.
 */
export default async function AdminReviewsPage() {
  await requirePermission("reviews", "view");

  return (
    <ModuleStub
      title="Customer Product Reviews"
      note="Review moderation is not wired up yet — the catalogue has no Review table, so there is nothing to show here. Published customer quotes live under Testimonials in the meantime."
    />
  );
}
