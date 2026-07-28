import { auth } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { ProductsManager } from "./ProductsManager";

export const metadata = { title: "Products" };

export default async function ProductsPage() {
  const session = await auth();
  const role = session!.user.role;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
        <p className="mt-1 text-sm text-white/40">
          Full catalogue CRUD — specs, media, related items and organisation.
        </p>
      </div>
      <ProductsManager
        permissions={{
          create: can(role, "products", "create"),
          edit: can(role, "products", "edit"),
          delete: can(role, "products", "delete"),
        }}
      />
    </div>
  );
}
