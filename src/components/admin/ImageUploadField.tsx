"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

import { uploadMediaClient } from "@/lib/client-upload";

interface ImageUploadFieldProps {
  label: string;
  value: string | null;
  onChange: (url: string | null) => void;
  aspect?: string; // tailwind aspect-* class
}

export function ImageUploadField({ label, value, onChange, aspect = "aspect-video" }: ImageUploadFieldProps) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const data = await uploadMediaClient(file, "images");
      onChange(data.url);
      toast.success("Image uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-white/70">{label}</span>
      <div
        className={cn(
          "group relative overflow-hidden rounded-xl border border-dashed border-white/15 bg-white/5 transition-colors hover:border-gold/40",
          aspect
        )}
      >
        {value ? (
          <>
            <Image src={value} alt="" fill sizes="400px" className="object-cover" />
            <button
              type="button"
              onClick={() => onChange(null)}
              className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-red-500"
              aria-label="Remove image"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex h-full w-full flex-col items-center justify-center gap-2 text-white/30 transition-colors hover:text-white/60"
          >
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <ImagePlus className="h-6 w-6" />
                <span className="text-xs">Click to upload</span>
              </>
            )}
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
      <input
        type="text"
        placeholder="…or paste an image URL"
        defaultValue={value ?? ""}
        onBlur={(e) => {
          if (e.target.value.trim()) onChange(e.target.value.trim());
        }}
        className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70 outline-none placeholder:text-white/25 focus:border-gold"
      />
    </div>
  );
}
