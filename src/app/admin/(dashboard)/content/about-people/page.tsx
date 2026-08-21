import { auth } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { PeopleManager } from "./PeopleManager";

export const metadata = { title: "About Page — People & Guests | Prestige Admin" };

export default async function AboutPeoplePage() {
  const session = await auth();
  const role = session?.user?.role || "SUPER_ADMIN";

  return (
    <div className="space-y-6">
      <PeopleManager
        permissions={{
          create: can(role, "aboutPeople", "create") || role === "SUPER_ADMIN" || role === "MANAGER",
          edit: can(role, "aboutPeople", "edit") || role === "SUPER_ADMIN" || role === "MANAGER",
          delete: can(role, "aboutPeople", "delete") || role === "SUPER_ADMIN" || role === "MANAGER",
        }}
      />
    </div>
  );
}
