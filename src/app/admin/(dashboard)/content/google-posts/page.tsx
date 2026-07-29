import { auth } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { GooglePostsManager } from "./GooglePostsManager";

export const metadata = { title: "Google Business Posts" };

export default async function GooglePostsPage() {
  const session = await auth();
  const role = session!.user.role;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Google Business Posts</h1>
        <p className="mt-1 text-sm text-white/40">
          Updates, offers and events mirrored from your Google Business Profile so the same
          announcement can render on the site. Entered by hand — Google&apos;s API needs per-user
          OAuth and verified ownership of each location.
        </p>
      </div>

      <GooglePostsManager
        permissions={{
          create: can(role, "showrooms", "create"),
          edit: can(role, "showrooms", "edit"),
          delete: can(role, "showrooms", "delete"),
        }}
      />
    </div>
  );
}
