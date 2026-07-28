import { auth } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { GalleryManager } from "./GalleryManager";

export const metadata = { title: "Gallery" };

export default async function GalleryPage() {
  const session = await auth();
  const role = session!.user.role;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Gallery</h1>
        <p className="mt-1 text-sm text-white/40">
          Organise photos into albums. Open an album to add, reorder or tag images.
        </p>
      </div>
      <GalleryManager
        permissions={{
          create: can(role, "gallery", "create"),
          edit: can(role, "gallery", "edit"),
          delete: can(role, "gallery", "delete"),
        }}
      />
    </div>
  );
}
