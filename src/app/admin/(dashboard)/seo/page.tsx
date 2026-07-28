import { auth } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { SeoManager } from "./SeoManager";

export const metadata = { title: "SEO Studio" };

export default async function SeoPage() {
  const session = await auth();
  const role = session!.user.role;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">SEO Studio</h1>
        <p className="mt-1 text-sm text-white/40">
          Per-page meta overrides, OpenGraph, JSON-LD and URL redirects.
        </p>
      </div>
      <SeoManager
        permissions={{
          create: can(role, "seo", "create"),
          edit: can(role, "seo", "edit"),
          delete: can(role, "seo", "delete"),
        }}
      />
    </div>
  );
}
