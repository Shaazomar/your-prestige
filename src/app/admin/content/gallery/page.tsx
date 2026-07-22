import { ModuleStub } from "@/components/admin/ModuleStub";

export const metadata = { title: "Gallery" };

export default function Page() {
  return (
    <ModuleStub
      title="Gallery"
      note="Curate the public gallery wall. Backed by the GalleryItem model."
    />
  );
}
