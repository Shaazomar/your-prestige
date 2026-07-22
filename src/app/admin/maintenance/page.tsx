import { ModuleStub } from "@/components/admin/ModuleStub";

export const metadata = { title: "Maintenance" };

export default function Page() {
  return (
    <ModuleStub
      title="Maintenance"
      note="Maintenance-mode toggle with password protection, countdown and IP whitelist."
    />
  );
}
