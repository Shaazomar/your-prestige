import { auth } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { VideosManager } from "./VideosManager";

export const metadata = { title: "Videos" };

export default async function VideosPage() {
  const session = await auth();
  const role = session!.user.role;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Videos</h1>
        <p className="mt-1 text-sm text-white/40">
          Showroom films and video reviews — YouTube, Vimeo or direct uploads.
        </p>
      </div>
      <VideosManager
        permissions={{
          create: can(role, "videos", "create"),
          edit: can(role, "videos", "edit"),
          delete: can(role, "videos", "delete"),
        }}
      />
    </div>
  );
}
