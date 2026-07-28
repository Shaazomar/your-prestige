import { auth } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { PortfolioManager } from "./PortfolioManager";

export const metadata = { title: "Portfolio" };

export default async function PortfolioPage() {
  const session = await auth();
  const role = session!.user.role;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Portfolio</h1>
        <p className="mt-1 text-sm text-white/40">
          Showcase delivered projects — villas, apartments, hotels and commercial builds.
        </p>
      </div>
      <PortfolioManager
        permissions={{
          create: can(role, "portfolio", "create"),
          edit: can(role, "portfolio", "edit"),
          delete: can(role, "portfolio", "delete"),
        }}
      />
    </div>
  );
}
