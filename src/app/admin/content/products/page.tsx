import { ModuleStub } from "@/components/admin/ModuleStub";

export const metadata = { title: "Products" };

export default function Page() {
  return (
    <ModuleStub
      title="Products"
      note="Full product CRUD backed by the Product, Category and Brand models — catalogue fields, media, downloads and SEO per product."
    />
  );
}
