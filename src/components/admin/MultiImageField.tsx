"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Plus, X, GripVertical, Star } from "lucide-react";

import { useMediaUpload } from "@/components/admin/media/useMediaUpload";
import { UploadQueue } from "@/components/admin/media/UploadQueue";
import type { MediaScope } from "@/lib/media/keys";

/**
 * Gallery field — add, remove and reorder several images for one record.
 *
 * Multi-select uploads run one at a time through the shared pipeline, each
 * with its own progress row, so dropping twenty photos gives twenty
 * independent outcomes instead of one all-or-nothing toast: a single
 * oversized file no longer discards the nineteen that were fine.
 */
interface MultiImageFieldProps {
  label: string;
  value: string[];
  onChange: (urls: string[]) => void;
  scope?: MediaScope;
  ownerId?: string | null;
  /** Labels the first image as the one used on cards and listings. */
  firstIsPrimary?: boolean;
}

export function MultiImageField({
  label,
  value,
  onChange,
  scope = "shared",
  ownerId,
  firstIsPrimary = false,
}: MultiImageFieldProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { items, busy, upload, retry, cancel, dismiss, clearFinished } = useMediaUpload({
    scope,
    ownerId,
    onUploaded: (media) => {
      onChange([...value, ...media.map((m) => m.url)]);
      clearFinished();
    },
  });

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
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="block text-sm font-medium text-white/70">{label}</span>
        {value.length > 0 && (
          <span className="text-xs text-white/35">
            {value.length} image{value.length === 1 ? "" : "s"}
            {firstIsPrimary ? " · first is primary" : ""}
          </span>
        )}
      </div>

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

            {firstIsPrimary && i === 0 && (
              <span
                className="absolute bottom-1 left-1 flex items-center gap-1 rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-gold"
                title="Shown on cards and listings"
              >
                <Star className="h-2.5 w-2.5" /> Primary
              </span>
            )}

            <div className="absolute inset-0 flex items-start justify-between bg-black/0 p-1 opacity-0 transition-opacity group-hover:bg-black/30 group-hover:opacity-100">
              <span className="cursor-grab rounded bg-black/50 p-1 text-white/70">
                <GripVertical className="h-3 w-3" />
              </span>
              <button
                type="button"
                onClick={() => remove(i)}
                className="rounded bg-black/50 p-1 text-white/70 hover:bg-red-500 hover:text-white"
                aria-label={`Remove image ${i + 1}`}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-white/15 text-white/30 transition-colors hover:border-gold/40 hover:text-white/60 disabled:opacity-50"
        >
          <Plus className="h-5 w-5" />
          <span className="text-[10px]">{busy ? "Uploading…" : "Add"}</span>
        </button>
      </div>

      <UploadQueue items={items} onRetry={retry} onCancel={cancel} onDismiss={dismiss} />

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) upload(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
