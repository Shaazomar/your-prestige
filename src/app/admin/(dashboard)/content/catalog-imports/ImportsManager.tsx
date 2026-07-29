"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Upload, ArrowUpRight, Loader2 } from "lucide-react";
import { AdminDataTable, type Column } from "@/components/admin/AdminDataTable";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { useAdminList } from "@/hooks/useAdminList";
import { createImport, listImports, restoreImport, softDeleteImport, type ImportRow } from "./actions";
import { STATUS_STYLES, STATUS_LABELS } from "./status";

export function ImportsManager({
  permissions,
}: {
  permissions: { create: boolean; edit: boolean; delete: boolean };
}) {
  const list = useAdminList<ImportRow>(listImports, { initialSortBy: "createdAt", initialSortDir: "desc" });
  const [deleting, setDeleting] = useState<ImportRow | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/admin/catalog-imports/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");

      await createImport({
        filename: data.filename,
        fileUrl: data.url,
        filePublicId: data.publicId ?? "",
        fileSize: data.size,
        // A sensible first guess from the filename; the extractor refines it
        // from the catalogue's own running header.
        brandNameGuess: file.name.replace(/\.pdf$/i, "").split(/[-_\s]/)[0],
      });

      toast.success(`${data.filename} uploaded — open it to start processing.`);
      list.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    try {
      await softDeleteImport(deleting.id);
      toast.success("Import moved to trash");
      list.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleting(null);
    }
  }

  async function handleRestore(row: ImportRow) {
    try {
      await restoreImport(row.id);
      toast.success("Import restored");
      list.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Restore failed");
    }
  }

  const columns: Column<ImportRow>[] = [
    {
      key: "filename",
      label: "Catalogue",
      sortable: true,
      render: (row) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{row.filename}</p>
          <p className="truncate text-xs text-white/35">
            {row.brandNameGuess ?? "Brand not detected"} · {(row.fileSize / 1024 / 1024).toFixed(1)} MB
            {row.pageCount > 0 && ` · ${row.pageCount} pages`}
          </p>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (row) => (
        <div>
          <span className={`rounded-full px-2.5 py-1 text-[0.65rem] font-semibold ${STATUS_STYLES[row.status]}`}>
            {STATUS_LABELS[row.status]}
          </span>
          {row.phaseMessage && <p className="mt-1 max-w-xs truncate text-xs text-white/35">{row.phaseMessage}</p>}
        </div>
      ),
    },
    {
      key: "createdAt",
      label: "Uploaded",
      sortable: true,
      render: (row) => (
        <span className="text-xs text-white/40">
          {new Date(row.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
        </span>
      ),
    },
    {
      key: "open",
      label: "",
      render: (row) => (
        <Link
          href={`/admin/content/catalog-imports/${row.id}`}
          className="inline-flex items-center gap-1 text-xs font-medium text-gold hover:underline"
        >
          Open <ArrowUpRight className="h-3 w-3" />
        </Link>
      ),
    },
  ];

  return (
    <>
      <AdminDataTable
        columns={columns}
        rows={list.rows}
        total={list.total}
        page={list.page}
        pageSize={list.pageSize}
        onPageChange={list.setPage}
        search={list.search}
        onSearchChange={list.setSearch}
        sortBy={list.sortBy}
        sortDir={list.sortDir}
        onSort={list.toggleSort}
        loading={list.loading}
        initialLoad={list.initialLoad}
        getId={(row) => row.id}
        trash={list.trash}
        onTrashToggle={list.setTrash}
        onDelete={permissions.delete ? setDeleting : undefined}
        onRestore={permissions.edit ? handleRestore : undefined}
        searchPlaceholder="Search catalogues…"
        emptyMessage="No catalogues imported yet. Upload a brand PDF to begin."
        toolbar={
          permissions.create ? (
            <>
              <input
                ref={fileInput}
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUpload(file);
                }}
              />
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileInput.current?.click()}
                className="inline-flex items-center gap-2 rounded-lg bg-gold px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-gold-deep disabled:opacity-60"
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {uploading ? "Uploading…" : "Upload Catalogue PDF"}
              </button>
            </>
          ) : undefined
        }
      />

      <ConfirmDialog
        open={!!deleting}
        title="Move import to trash?"
        description={`"${deleting?.filename}" and its staged products will be hidden. Products already published stay live.`}
        confirmLabel="Move to Trash"
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}
