import { auth } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { TestimonialsManager } from "./TestimonialsManager";

export const metadata = { title: "Testimonials" };

export default async function TestimonialsPage() {
  const session = await auth();
  const role = session!.user.role;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Testimonials</h1>
        <p className="mt-1 text-sm text-white/40">
          Customer voices, Google reviews and video testimonials.
        </p>
      </div>
      <TestimonialsManager
        permissions={{
          create: can(role, "testimonials", "create"),
          edit: can(role, "testimonials", "edit"),
          delete: can(role, "testimonials", "delete"),
        }}
      />
    </div>
  );
}
