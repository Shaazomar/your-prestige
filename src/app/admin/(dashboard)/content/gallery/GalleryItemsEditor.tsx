"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Plus, X, Loader2, GripVertical } from "lucide-react";
import {
  listAlbumItems, addAlbumItems, updateAlbumItem, deleteAlbumItem, reorderAlbumItems, type GalleryItemRow,
} from "./actions";

export function GalleryItemsEditor({ albumId }: { albumId: string }) {
  const [items, setItems] = useState<GalleryItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listAlbumItems(albumId).then((rows) => {
      setItems(rows);
      setLoading(false);
    });
  }, [albumId]);

  async function handleFiles(files: FileList) {
    setUploading(true);
    try {
      const urls: string[] = [];
      const total = files.length;
      for (let i = 0; i < total; i++) {
        const file = files[i];
        toast.loading(`Uploading "${file.name}" (${i + 1}/${total})…`, { id: "gallery-upload" });
        const form = new FormData();
        form.append("file", file);
        const res = await fetch("/api/admin/media", { method: "POST", body: form });
        if (!res.ok) throw new Error(`Upload failed for file: ${file.name}`);
        const data = await res.json();
        urls.push(data.url);
      }
      toast.loading("Saving gallery updates…", { id: "gallery-upload" });
      const created = await addAlbumItems(albumId, urls);
      setItems((prev) => [...prev, ...created]);
      toast.success(`${urls.length} image${urls.length > 1 ? "s" : ""} added successfully`, { id: "gallery-upload" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed", { id: "gallery-upload" });
    } finally {
      setUploading(false);
    }
  }

  async function handleAltChange(id: string, alt: string) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, alt } : i)));
  }

  async function handleAltBlur(id: string, alt: string) {
    await updateAlbumItem(id, { alt });
  }

  async function handleDelete(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    await deleteAlbumItem(id);
    toast.success("Image removed");
  }

  async function handleDrop(index: number) {
    if (dragIndex === null || dragIndex === index) return setDragIndex(null);
    const next = [...items];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(index, 0, moved);
    setItems(next);
    setDragIndex(null);
    await reorderAlbumItems(next.map((i) => i.id));
  }

  if (loading) {
    return (
      <div className="flex h-24 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-white/30" />
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div
            key={item.id}
            draggable
            onDragStart={() => setDragIndex(i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(i)}
            className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-2"
          >
            <span className="cursor-grab text-white/30">
              <GripVertical className="h-4 w-4" />
            </span>
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg">
              <Image src={item.url} alt="" fill sizes="48px" className="object-cover" />
            </div>
            <input
              value={item.alt ?? ""}
              onChange={(e) => handleAltChange(item.id, e.target.value)}
              onBlur={(e) => handleAltBlur(item.id, e.target.value)}
              placeholder="Alt text…"
              className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white outline-none placeholder:text-white/25 focus:border-gold"
            />
            <button
              onClick={() => handleDelete(item.id)}
              aria-label="Remove image"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-red-500/10 hover:text-red-400"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
        {items.length === 0 && <p className="rounded-xl border border-dashed border-white/10 py-6 text-center text-xs text-white/30">No images yet.</p>}
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 py-3 text-sm text-white/50 transition-colors hover:border-gold/40 hover:text-white/80"
      >
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        Add Images
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
