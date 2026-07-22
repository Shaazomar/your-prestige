import { ModuleStub } from "@/components/admin/ModuleStub";

export const metadata = { title: "Users & Roles" };

export default function Page() {
  return (
    <ModuleStub
      title="Users & Roles"
      note="RBAC with seven roles from Super Admin to Viewer. Backed by the User model and Role enum."
    />
  );
}
