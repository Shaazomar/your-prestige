import { auth } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { isCloudinaryConfigured } from "@/lib/storage";
import { MediaManager } from "./MediaManager";

export const metadata = { title: "Media Library" };

export default async function MediaPage() {
  const session = await auth();
  const role = session!.user.role;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Media Library</h1>
        <p className="mt-1 text-sm text-white/40">
          {isCloudinaryConfigured
            ? "Uploads are stored on Cloudinary."
            : "Uploads are stored locally for development — connect Cloudinary in Settings before deploying."}
        </p>
      </div>
      <MediaManager
        permissions={{
          create: can(role, "media", "create"),
          edit: can(role, "media", "edit"),
          delete: can(role, "media", "delete"),
        }}
      />
    </div>
  );
}
