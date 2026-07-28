import { auth } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { CategoriesManager } from "./CategoriesManager";

export const metadata = { title: "Categories" };

export default async function CategoriesPage() {
  const session = await auth();
  const role = session!.user.role;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Categories</h1>
        <p className="mt-1 text-sm text-white/40">
          Organise the catalogue tree — nest subcategories under a parent.
        </p>
      </div>
      <CategoriesManager
        permissions={{
          create: can(role, "categories", "create"),
          edit: can(role, "categories", "edit"),
          delete: can(role, "categories", "delete"),
        }}
      />
    </div>
  );
}
