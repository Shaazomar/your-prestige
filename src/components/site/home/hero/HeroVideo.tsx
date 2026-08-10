"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { OrganicVideoShape } from "./OrganicVideoShape";
import { VideoPlayButton } from "./VideoPlayButton";
import { WatchStoryBadge } from "./WatchStoryBadge";

interface HeroVideoProps {
  posterImage: string;
  videoSrc?: string;
  modalVideoUrl?: string;
}

export function HeroVideo({ posterImage, videoSrc, modalVideoUrl }: HeroVideoProps) {
  const [videoOpen, setVideoOpen] = useState(false);

  const activeModalUrl =
    modalVideoUrl || videoSrc || "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1";

  const isNativeVideo =
    activeModalUrl.startsWith("/uploads/") ||
    activeModalUrl.endsWith(".mp4") ||
    activeModalUrl.endsWith(".mov") ||
    activeModalUrl.endsWith(".webm") ||
    activeModalUrl.includes("amazonaws.com") ||
    activeModalUrl.includes("s3");

  return (
    <>
      <div className="relative w-full aspect-[4/3] sm:aspect-[14/11] lg:h-[620px]">
        <OrganicVideoShape posterImage={posterImage} videoSrc={videoSrc}>
          {/* Centered Play Button */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
            <VideoPlayButton onClick={() => setVideoOpen(true)} />
          </div>
        </OrganicVideoShape>

        {/* Floating Watch Story Badge */}
        <WatchStoryBadge onClick={() => setVideoOpen(true)} />
      </div>

      {/* Fullscreen Video Story Modal */}
      {videoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-4xl overflow-hidden rounded-3xl bg-charcoal shadow-2xl">
            <button
              onClick={() => setVideoOpen(false)}
              className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white hover:text-ink transition-colors"
              aria-label="Close video"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="relative aspect-video w-full flex items-center justify-center bg-black">
              {isNativeVideo ? (
                <video
                  src={activeModalUrl}
                  controls
                  autoPlay
                  className="h-full w-full object-contain"
                />
              ) : (
                <iframe
                  src={activeModalUrl}
                  title="Prestige Tiles Brand Story"
                  className="h-full w-full border-0"
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
