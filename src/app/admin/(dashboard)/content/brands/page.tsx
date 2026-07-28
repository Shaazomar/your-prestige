import { auth } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { BrandsManager } from "./BrandsManager";

export const metadata = { title: "Brands" };

export default async function BrandsPage() {
  const session = await auth();
  const role = session!.user.role;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Brands</h1>
        <p className="mt-1 text-sm text-white/40">
          Manage partner houses — logos, banners, catalogues and featured placement.
        </p>
      </div>
      <BrandsManager
        permissions={{
          create: can(role, "brands", "create"),
          edit: can(role, "brands", "edit"),
          delete: can(role, "brands", "delete"),
        }}
      />
    </div>
  );
}
