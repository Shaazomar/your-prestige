"use client";

import { useRef, useState } from "react";
import { Video, X, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

import { useMediaUpload } from "@/components/admin/media/useMediaUpload";
import { UploadQueue } from "@/components/admin/media/UploadQueue";
import type { MediaScope } from "@/lib/media/keys";

/**
 * Single-video field.
 *
 * Video is the case the old server-side fallback could never serve: a brand
 * hero clip is routinely tens of megabytes, and routing it through the app
 * server meant hitting the serverless request-body limit and being told the
 * file was too large. Uploading straight to S3 removes that ceiling entirely
 * — the 50MB limit here is our own, and is enforced before any bytes move.
 */
interface VideoUploadFieldProps {
  label: string;
  value: string | null;
  onChange: (url: string | null) => void;
  aspect?: string;
  scope?: MediaScope;
  ownerId?: string | null;
  hint?: string;
}

export function VideoUploadField({
  label,
  value,
  onChange,
  aspect = "aspect-video",
  scope = "shared",
  ownerId,
  hint,
}: VideoUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [urlDraft, setUrlDraft] = useState(value ?? "");

  const { items, busy, upload, retry, cancel, dismiss, clearFinished } = useMediaUpload({
    scope,
    ownerId,
    onUploaded: (media) => {
      onChange(media[media.length - 1].url);
      setUrlDraft(media[media.length - 1].url);
      clearFinished();
    },
  });

  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-white/70">{label}</span>
      {hint && <p className="mb-1.5 text-xs text-white/35">{hint}</p>}

      <div
        className={cn(
          "group relative overflow-hidden rounded-xl border border-dashed border-white/15 bg-white/5 transition-colors hover:border-gold/40",
          aspect
        )}
      >
        {value ? (
          <>
            <video
              key={value}
              src={value}
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute right-2 top-2 z-10 flex gap-1.5">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={busy}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-gold hover:text-black disabled:opacity-40"
                aria-label={`Replace ${label}`}
                title="Replace"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  onChange(null);
                  setUrlDraft("");
                }}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-red-500"
                aria-label={`Remove ${label}`}
                title="Remove"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="flex h-full w-full flex-col items-center justify-center gap-2 text-white/30 transition-colors hover:text-white/60 disabled:opacity-50"
          >
            <Video className="h-6 w-6" />
            <span className="text-xs">{busy ? "Uploading…" : "Click to upload video"}</span>
            <span className="text-[10px] text-white/20">MP4, WebM or MOV · up to 50MB</span>
          </button>
        )}
      </div>

      <UploadQueue items={items} onRetry={retry} onCancel={cancel} onDismiss={dismiss} />

      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) upload(e.target.files);
          e.target.value = "";
        }}
      />

      <input
        type="text"
        placeholder="…or paste a video URL"
        value={urlDraft}
        onChange={(e) => setUrlDraft(e.target.value)}
        onBlur={(e) => {
          const next = e.target.value.trim();
          if (next !== (value ?? "")) onChange(next || null);
        }}
        className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70 outline-none placeholder:text-white/25 focus:border-gold"
      />
    </div>
  );
}
