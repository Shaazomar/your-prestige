"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import {
  Upload, Search, Trash2, RotateCcw, Loader2, Inbox, FolderPlus, Folder, File as FileIcon,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import { useAdminList } from "@/hooks/useAdminList";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { cn } from "@/lib/utils";
import {
  listMedia, listFolders, createFolder, updateMediaMeta, softDeleteMedia, restoreMedia,
  type MediaRow,
} from "./actions";
import type { MediaFolder } from "@prisma/client";

export function MediaManager({ permissions }: { permissions: { create: boolean; edit: boolean; delete: boolean } }) {
  const [folderId, setFolderId] = useState<string | null | undefined>(undefined);
  const list = useAdminList<MediaRow>(
    (params) => listMedia({ ...params, folderId }),
    { pageSize: 24, initialSortBy: "createdAt" }
  );
  const [folders, setFolders] = useState<MediaFolder[]>([]);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<MediaRow | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listFolders().then(setFolders);
  }, []);

  async function handleUpload(files: FileList) {
    setUploading(true);
    let success = 0;
    const total = files.length;
    for (let i = 0; i < total; i++) {
      const file = files[i];
      toast.loading(`Uploading "${file.name}" (${i + 1}/${total})…`, { id: "media-upload" });
      try {
        const form = new FormData();
        form.append("file", file);
        const res = await fetch("/api/admin/media", { method: "POST", body: form });
        if (res.ok) success++;
      } catch (err) {
        console.error(err);
      }
    }
    toast.dismiss("media-upload");
    setUploading(false);
    if (success > 0) {
      toast.success(`${success}/${total} file${success > 1 ? "s" : ""} uploaded successfully`);
      list.refresh();
    } else {
      toast.error("Upload failed");
    }
  }

  async function handleNewFolder() {
    const name = prompt("Folder name?");
    if (!name?.trim()) return;
    const folder = await createFolder(name.trim());
    setFolders((f) => [...f, folder]);
    toast.success(`Folder "${name}" created`);
  }

  async function handleDelete() {
    if (!deleting) return;
    try {
      await softDeleteMedia(deleting.id);
      toast.success("Moved to trash");
      list.refresh();
    } catch {
      toast.error("Delete failed");
    } finally {
      setDeleting(null);
    }
  }

  async function handleRestore(row: MediaRow) {
    await restoreMedia(row.id);
    toast.success("Restored");
    list.refresh();
  }

  async function handleAltBlur(row: MediaRow, alt: string) {
    await updateMediaMeta(row.id, { altText: alt });
  }

  const totalPages = Math.max(1, Math.ceil(list.total / list.pageSize));

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      {/* Folder sidebar */}
      <div className="space-y-1">
        <button
          onClick={() => setFolderId(undefined)}
          className={cn("flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm", folderId === undefined ? "bg-gold/15 text-gold" : "text-white/60 hover:bg-white/5")}
        >
          <Folder className="h-4 w-4" /> All Files
        </button>
        <button
          onClick={() => setFolderId(null)}
          className={cn("flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm", folderId === null ? "bg-gold/15 text-gold" : "text-white/60 hover:bg-white/5")}
        >
          <Folder className="h-4 w-4" /> Unfiled
        </button>
        {folders.map((f) => (
          <button
            key={f.id}
            onClick={() => setFolderId(f.id)}
            className={cn("flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm", folderId === f.id ? "bg-gold/15 text-gold" : "text-white/60 hover:bg-white/5")}
          >
            <Folder className="h-4 w-4" /> {f.name}
          </button>
        ))}
        {permissions.create && (
          <button onClick={handleNewFolder} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-white/40 hover:bg-white/5 hover:text-white">
            <FolderPlus className="h-4 w-4" /> New Folder
          </button>
        )}
      </div>

      {/* Main */}
      <div>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
            <input
              value={list.search}
              onChange={(e) => list.setSearch(e.target.value)}
              placeholder="Search filename or alt text…"
              className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white outline-none transition-colors focus:border-gold"
            />
          </div>
          <div className="flex overflow-hidden rounded-xl border border-white/10">
            <button onClick={() => list.setTrash(false)} className={cn("px-3.5 py-2 text-xs font-medium", !list.trash ? "bg-gold/15 text-gold" : "text-white/50")}>Active</button>
            <button onClick={() => list.setTrash(true)} className={cn("px-3.5 py-2 text-xs font-medium", list.trash ? "bg-gold/15 text-gold" : "text-white/50")}>Trash</button>
          </div>
          {permissions.create && (
            <button
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 rounded-xl bg-gold px-4 py-2.5 text-sm font-semibold text-ivory transition-colors hover:bg-gold-deep disabled:opacity-60"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Upload
            </button>
          )}
          <input ref={inputRef} type="file" multiple accept="image/*,application/pdf" className="hidden" onChange={(e) => { if (e.target.files?.length) handleUpload(e.target.files); e.target.value = ""; }} />
        </div>

        {list.initialLoad ? (
          <div className="flex h-48 items-center justify-center rounded-2xl border border-white/8 bg-[#141413]">
            <Loader2 className="h-6 w-6 animate-spin text-white/30" />
          </div>
        ) : list.rows.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-white/12 bg-[#141413] py-20 text-center">
            <Inbox className="mb-3 h-8 w-8 text-white/15" />
            <p className="text-sm text-white/35">{list.trash ? "Trash is empty." : "No media yet — upload your first file."}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {list.rows.map((row) => (
              <div key={row.id} className="group relative overflow-hidden rounded-xl border border-white/8 bg-[#141413]">
                <div className="relative aspect-square bg-white/5">
                  {row.mimeType.startsWith("image/") ? (
                    <Image src={row.url} alt={row.altText ?? ""} fill sizes="200px" className="object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <FileIcon className="h-8 w-8 text-white/20" />
                    </div>
                  )}
                  <div className="absolute right-1.5 top-1.5 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    {list.trash
                      ? permissions.edit && (
                          <button onClick={() => handleRestore(row)} className="flex h-7 w-7 items-center justify-center rounded-lg bg-black/60 text-emerald-400 hover:bg-emerald-400/20">
                            <RotateCcw className="h-3.5 w-3.5" />
                          </button>
                        )
                      : permissions.delete && (
                          <button onClick={() => setDeleting(row)} className="flex h-7 w-7 items-center justify-center rounded-lg bg-black/60 text-red-400 hover:bg-red-400/20">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                  </div>
                </div>
                <div className="p-2">
                  <p className="truncate text-xs text-white/50">{row.filename}</p>
                  {permissions.edit && !list.trash && (
                    <input
                      defaultValue={row.altText ?? ""}
                      onBlur={(e) => handleAltBlur(row, e.target.value)}
                      placeholder="Alt text…"
                      className="mt-1 w-full rounded-md border border-white/8 bg-white/5 px-2 py-1 text-[0.65rem] text-white/60 outline-none focus:border-gold"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {list.total > 0 && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-white/35">{list.total} files</p>
            <div className="flex items-center gap-1.5">
              <button onClick={() => list.setPage(list.page - 1)} disabled={list.page <= 1} className="flex h-8 w-8 items-center justify-center rounded-lg text-white/50 hover:bg-white/8 disabled:opacity-25">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-2 text-xs text-white/40">{list.page} / {totalPages}</span>
              <button onClick={() => list.setPage(list.page + 1)} disabled={list.page >= totalPages} className="flex h-8 w-8 items-center justify-center rounded-lg text-white/50 hover:bg-white/8 disabled:opacity-25">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleting}
        title="Move to trash?"
        description={`"${deleting?.filename}" will be moved to trash.`}
        confirmLabel="Move to Trash"
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
