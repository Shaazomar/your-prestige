import { requirePermission } from "@/lib/rbac";
import { ModuleStub } from "@/components/admin/ModuleStub";

export const dynamic = "force-dynamic";
export const metadata = { title: "Reports & Intelligence" };

/**
 * The four report cards here were placeholders: fixed titles, a hard-coded
 * "Aug 2026" period and an Export button with no handler. Nothing generated a
 * report. The audit log CSV export under Logs is the one export that works.
 */
export default async function AdminReportsPage() {
  await requirePermission("reports", "view");

  return (
    <ModuleStub
      title="Reports & Business Intelligence"
      note="Scheduled report exports are not implemented yet. Live figures are on the Dashboard and Analytics screens, and the audit trail can be exported as CSV from Logs."
    />
  );
}
