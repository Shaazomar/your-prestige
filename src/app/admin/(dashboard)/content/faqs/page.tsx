import { auth } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { FaqsManager } from "./FaqsManager";

export const metadata = { title: "FAQs" };

export default async function FaqsPage() {
  const session = await auth();
  const role = session!.user.role;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">FAQs</h1>
        <p className="mt-1 text-sm text-white/40">
          Questions surfaced on the site and in FAQPage schema markup.
        </p>
      </div>
      <FaqsManager
        permissions={{
          create: can(role, "faqs", "create"),
          edit: can(role, "faqs", "edit"),
          delete: can(role, "faqs", "delete"),
        }}
      />
    </div>
  );
}
