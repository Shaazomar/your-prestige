import { ModuleStub } from "@/components/admin/ModuleStub";

export const metadata = { title: "Audit Logs" };

export default function Page() {
  return (
    <ModuleStub
      title="Audit Logs"
      note="Every sensitive action recorded. Backed by the AuditLog model."
    />
  );
}
