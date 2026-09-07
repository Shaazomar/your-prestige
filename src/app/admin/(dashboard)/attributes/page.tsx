import { requirePermission } from "@/lib/rbac";
import { ModuleStub } from "@/components/admin/ModuleStub";

export const dynamic = "force-dynamic";
export const metadata = { title: "Attributes & Product Specifications" };

/**
 * No Attribute model exists; the previous version listed six invented
 * attribute sets behind an "Add Attribute" button that did nothing.
 * Product specifications are edited per product on the product form.
 */
export default async function AdminAttributesPage() {
  await requirePermission("attributes", "view");

  return (
    <ModuleStub
      title="Attributes & Specifications Builder"
      note="A shared attribute library is not built yet — there is no Attribute table behind this screen. Per-product specifications, finish, size and thickness are edited on each product under Catalog → Products."
    />
  );
}
