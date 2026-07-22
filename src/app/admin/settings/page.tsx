import { ModuleStub } from "@/components/admin/ModuleStub";

export const metadata = { title: "Settings" };

export default function Page() {
  return (
    <ModuleStub
      title="Settings"
      note="Business details, theme, integrations, WhatsApp and AI configuration. Backed by the Setting key-value store."
    />
  );
}
