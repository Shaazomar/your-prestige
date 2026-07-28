import { auth } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { PostsManager } from "./PostsManager";

export const metadata = { title: "Journal" };

export default async function BlogPage() {
  const session = await auth();
  const role = session!.user.role;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Journal</h1>
        <p className="mt-1 text-sm text-white/40">
          Write, schedule and publish SEO-optimised articles.
        </p>
      </div>
      <PostsManager
        permissions={{
          create: can(role, "blog", "create"),
          edit: can(role, "blog", "edit"),
          delete: can(role, "blog", "delete"),
        }}
      />
    </div>
  );
}
