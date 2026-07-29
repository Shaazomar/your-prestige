import { auth } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { ImportsManager } from "./ImportsManager";

export const metadata = { title: "Catalog Imports" };

// Import slices run inside Server Actions, which inherit this segment's limit.
export const maxDuration = 60;

export default async function CatalogImportsPage() {
  const session = await auth();
  const role = session!.user.role;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Catalog Imports</h1>
        <p className="mt-1 text-sm text-white/40">
          Upload a brand catalogue PDF and it will be read for products, specifications and embedded
          photography. Nothing reaches the website until you approve it.
        </p>
      </div>

      <ImportsManager
        permissions={{
          create: can(role, "catalogImports", "create"),
          edit: can(role, "catalogImports", "edit"),
          delete: can(role, "catalogImports", "delete"),
        }}
      />
    </div>
  );
}
