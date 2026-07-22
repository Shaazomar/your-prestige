import { ModuleStub } from "@/components/admin/ModuleStub";

export const metadata = { title: "Media Library" };

export default function Page() {
  return (
    <ModuleStub
      title="Media Library"
      note="Folders, tags, alt text and automatic optimisation via UploadThing or Cloudinary."
    />
  );
}
