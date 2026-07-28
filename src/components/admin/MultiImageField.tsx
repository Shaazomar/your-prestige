"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Plus, X, Loader2, GripVertical } from "lucide-react";

interface MultiImageFieldProps {
  label: string;
  value: string[];
  onChange: (urls: string[]) => void;
}

/** Grid gallery uploader — add/remove/reorder multiple images for one field. */
export function MultiImageField({ label, value, onChange }: MultiImageFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList) {
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        const form = new FormData();
        form.append("file", file);
        const res = await fetch("/api/admin/media", { method: "POST", body: form });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Upload failed");
        }
        const data = await res.json();
        uploaded.push(data.url);
      }
      onChange([...value, ...uploaded]);
      toast.success(`${uploaded.length} image${uploaded.length > 1 ? "s" : ""} uploaded`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function remove(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function reorder(from: number, to: number) {
    if (from === to) return;
    const next = [...value];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  }

  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-white/70">{label}</span>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {value.map((url, i) => (
          <div
            key={url + i}
            draggable
            onDragStart={() => setDragIndex(i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (dragIndex !== null) reorder(dragIndex, i);
              setDragIndex(null);
            }}
            className="group relative aspect-square overflow-hidden rounded-lg border border-white/10 bg-white/5"
          >
            <Image src={url} alt="" fill sizes="120px" className="object-cover" />
            <div className="absolute inset-0 flex items-start justify-between bg-black/0 p-1 opacity-0 transition-opacity group-hover:bg-black/30 group-hover:opacity-100">
              <span className="cursor-grab rounded bg-black/50 p-1 text-white/70">
                <GripVertical className="h-3 w-3" />
              </span>
              <button
                type="button"
                onClick={() => remove(i)}
                className="rounded bg-black/50 p-1 text-white/70 hover:bg-red-500 hover:text-white"
                aria-label="Remove image"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex aspect-square items-center justify-center rounded-lg border border-dashed border-white/15 text-white/30 transition-colors hover:border-gold/40 hover:text-white/60"
        >
          {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
        </button>
      </div>
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
