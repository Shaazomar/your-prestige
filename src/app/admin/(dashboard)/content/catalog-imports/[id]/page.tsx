import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText, Images, Package, XCircle } from "lucide-react";
import { auth } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { ImportRunner } from "../ImportRunner";
import { ReviewGrid } from "../ReviewGrid";
import type { ImportStats } from "@/lib/import/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await prisma.catalogImport.findUnique({ where: { id }, select: { filename: true } });
  return { title: job?.filename ?? "Catalog Import" };
}

export default async function ImportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const role = session!.user.role;

  const job = await prisma.catalogImport.findFirst({ where: { id, deletedAt: null } });
  if (!job) notFound();

  const [productCount, assetCount, rejectedCount] = await Promise.all([
    prisma.extractedProduct.count({ where: { importId: id, deletedAt: null } }),
    prisma.importAsset.count({ where: { importId: id, rejected: false } }),
    prisma.importAsset.count({ where: { importId: id, rejected: true } }),
  ]);

  const stats = (job.stats ?? {}) as Partial<ImportStats>;

  const tiles = [
    { label: "Pages", value: job.pageCount, icon: FileText },
    { label: "Products found", value: productCount, icon: Package },
    { label: "Images kept", value: assetCount, icon: Images },
    { label: "Images discarded", value: rejectedCount, icon: XCircle },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/content/catalog-imports"
          className="mb-3 inline-flex items-center gap-1.5 text-xs text-white/40 transition-colors hover:text-gold"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> All imports
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">{job.filename}</h1>
        <p className="mt-1 text-sm text-white/40">
          {job.brandNameGuess ?? "Brand not yet detected"} · {(job.fileSize / 1024 / 1024).toFixed(1)} MB
          {stats.duplicates ? ` · ${stats.duplicates} duplicate images skipped` : ""}
        </p>
      </div>

      <ImportRunner job={job} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-2xl border border-white/8 bg-[#141413] p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-white/45">{t.label}</p>
              <t.icon className="h-4 w-4 text-gold" />
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight">{t.value}</p>
          </div>
        ))}
      </div>

      {productCount > 0 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Review &amp; approve</h2>
            <p className="mt-1 text-sm text-white/40">
              Sorted least-confident first. Check the fields against the page number shown on each card,
              correct anything wrong, then approve what should go live.
            </p>
          </div>
          <ReviewGrid
            importId={id}
            canEdit={can(role, "catalogImports", "edit")}
            canPublish={can(role, "catalogImports", "publish")}
          />
        </div>
      )}
    </div>
  );
}
