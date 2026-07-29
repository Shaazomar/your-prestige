import { auth } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { LandingPagesManager } from "./LandingPagesManager";

export const metadata = { title: "Landing Pages" };

export default async function LandingPagesPage() {
  const session = await auth();
  const role = session!.user.role;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Landing Pages</h1>
        <p className="mt-1 text-sm text-white/40">
          Keyword pages served at root URLs — /tiles-mangaluru, /jaquar-dealer-mangaluru. Each one
          should say something genuinely specific to its location or product; near-identical pages
          get demoted rather than ranked.
        </p>
      </div>

      <LandingPagesManager
        permissions={{
          create: can(role, "landingPages", "create"),
          edit: can(role, "landingPages", "edit"),
          delete: can(role, "landingPages", "delete"),
        }}
      />
    </div>
  );
}
