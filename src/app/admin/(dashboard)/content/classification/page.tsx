import { auth } from "@/lib/auth";
import { can, requirePermission } from "@/lib/rbac";
import { ClassificationManager } from "./ClassificationManager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Catalogue Classification" };

export default async function ClassificationPage() {
  await requirePermission("products", "view");

  const session = await auth();
  const role = session!.user.role;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Catalogue Classification</h1>
        <p className="mt-1 text-sm text-white/40">
          Products the classifier would not place on its own. Filing one here marks it as a human
          decision, which the classifier will never overwrite.
        </p>
      </div>
      <ClassificationManager canEdit={can(role, "products", "edit")} />
    </div>
  );
}
