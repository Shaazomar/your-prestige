import { requirePermission } from "@/lib/rbac";
import { ExcelImporter } from "./ExcelImporter";

export const metadata = { title: "Excel Bulk Import" };

export default async function ExcelImportPage() {
  await requirePermission("catalogImports", "create");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Excel Bulk Product Import</h1>
        <p className="mt-1 text-sm text-white/40">
          Upload spreadsheet files (CSV) to add new items or update price and inventory stock levels in bulk.
        </p>
      </div>
      <ExcelImporter />
    </div>
  );
}
