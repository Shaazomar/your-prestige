import { auth } from "@/lib/auth";
import { can, requirePermission } from "@/lib/rbac";
import { activeStorageProvider } from "@/lib/storage";
import { MediaManager } from "./MediaManager";

export const metadata = { title: "Media Library" };

export default async function MediaPage() {
  await requirePermission("media", "view");

  const session = await auth();
  const role = session!.user.role;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Media Library</h1>
        <p className="mt-1 text-sm text-white/40">
          {{
            s3: "Uploads are stored on AWS S3.",
            cloudinary: "Uploads are stored on Cloudinary.",
            local: "Uploads are stored on local disk for development — configure AWS S3 or Cloudinary before deploying.",
          }[activeStorageProvider()]}
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
