import { ModuleStub } from "@/components/admin/ModuleStub";

export const metadata = { title: "Videos" };

export default function Page() {
  return (
    <ModuleStub
      title="Videos"
      note="Manage showroom films and video reviews. Backed by GalleryItem (type=video)."
    />
  );
}
