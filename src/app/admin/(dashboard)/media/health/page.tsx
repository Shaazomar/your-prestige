import { auth } from "@/lib/auth";
import { can, requirePermission } from "@/lib/rbac";
import { MediaHealthManager } from "./MediaHealthManager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Media Health Check" };

export default async function MediaHealthPage() {
  await requirePermission("media", "view");

  const session = await auth();
  const role = session!.user.role;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Media Health Check</h1>
        <p className="mt-1 text-sm text-white/40">
          Finds broken and missing imagery across the site — products, brands, categories, collections,
          showrooms and the About page — before a customer does.
        </p>
      </div>
      <MediaHealthManager canEdit={can(role, "media", "edit")} />
    </div>
  );
}
