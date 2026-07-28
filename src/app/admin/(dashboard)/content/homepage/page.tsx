import { auth } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { HomepageManager } from "./HomepageManager";

export const metadata = { title: "Homepage Editor" };

export default async function HomepagePage() {
  const session = await auth();
  const role = session!.user.role;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Homepage Editor</h1>
        <p className="mt-1 text-sm text-white/40">
          Edit the hero section live, preview your changes, then publish.
        </p>
      </div>
      <HomepageManager canPublish={can(role, "homepage", "publish")} />
    </div>
  );
}
